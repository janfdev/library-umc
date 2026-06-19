import { db } from "../../../db";
import {
  importBatches, importBibliographyRows, importItemRows, importErrors,
  bibliographies, items, bibliographyAuthors, bibliographySubjects,
  authors, subjects, publishers, publicationPlaces, gmds, collectionTypes, languages, locations
} from "../../../db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { syncCollectionAvailableStock } from "../../shared/utils/stock-sync";
import crypto from "crypto";

function normalizeName(n: string): string { return n.trim().toLowerCase().replace(/\s+/g, " "); }

function parseAngleBracketMultiValue(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  const matches = raw.match(/<([^>]+)>/g);
  if (!matches) return [raw.trim()].filter(s => s.length > 0);
  return matches.map(m => m.slice(1, -1).trim()).filter(s => s.length > 0);
}

function detectDelimiter(raw: string): ";" | "," {
  const firstLine = raw.split("\n")[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export class ImportService {

  async createBatch(type: "bibliography" | "item", filename: string, userId: string, fileContent: string) {
    const [batch] = await db.insert(importBatches).values({
      type,
      filename,
      status: "uploading",
      createdBy: userId,
      metadata: { fileContent },
    }).returning();
    return batch;
  }

  async parseBatch(batchId: string) {
    const batch = await db.query.importBatches.findFirst({
      where: eq(importBatches.id, batchId),
    });
    if (!batch) throw new Error("Batch not found");

    await db.update(importBatches).set({ status: "parsing" }).where(eq(importBatches.id, batchId));

    const fileContent = (batch.metadata as any)?.fileContent;
    if (!fileContent) throw new Error("No file content in batch metadata");

    const delimiter = detectDelimiter(fileContent);
    const lines = fileContent.split("\n").filter((l: string) => l.trim().length > 0);

    if (lines.length < 2) {
      await db.update(importBatches).set({ status: "failed", metadata: { error: "No data rows" } }).where(eq(importBatches.id, batchId));
      return { totalRows: 0, errors: ["No data rows"] };
    }

    const headers = parseCsvLine(lines[0], delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const dataLines = lines.slice(1);

    // Clear old rows for this batch
    await db.delete(importBibliographyRows).where(eq(importBibliographyRows.batchId, batchId));
    await db.delete(importItemRows).where(eq(importItemRows.batchId, batchId));
    await db.delete(importErrors).where(eq(importErrors.batchId, batchId));

    const chunkSize = 500;
    let validCount = 0;
    let invalidCount = 0;

    const isBiblio = batch.type === "bibliography";
    const targetTable = isBiblio ? importBibliographyRows : importItemRows;

    for (let i = 0; i < dataLines.length; i += chunkSize) {
      const chunk = dataLines.slice(i, i + chunkSize);
      const validRows: any[] = [];
      const errorRows: any[] = [];

      for (let j = 0; j < chunk.length; j++) {
        const line = chunk[j];
        const values = parseCsvLine(line, delimiter);
        const rawData: Record<string, string> = {};
        headers.forEach((h, hi) => { rawData[h] = (values[hi] || "").trim(); });

        const rowErrors: string[] = [];
        if (isBiblio) {
          if (!rawData.title || rawData.title.length < 1) rowErrors.push("title is required");
        } else {
          if (!rawData.item_code || rawData.item_code.length < 1) rowErrors.push("item_code is required");
        }

        if (rowErrors.length > 0) {
          invalidCount++;
          errorRows.push({
            batchId,
            rowNumber: i + j + 1,
            rawData,
            errors: rowErrors,
          });
        } else {
          validCount++;
          validRows.push({
            batchId,
            rowNumber: i + j + 1,
            rawData,
            status: "valid" as const,
          });
        }
      }

      if (validRows.length > 0) {
        await db.insert(targetTable).values(validRows);
      }
      if (errorRows.length > 0) {
        await db.insert(importErrors).values(errorRows);
      }
    }

    await db.update(importBatches).set({
      status: "preview",
      totalRows: dataLines.length,
      processedRows: dataLines.length,
      validRows: validCount,
      invalidRows: invalidCount,
    }).where(eq(importBatches.id, batchId));

    // Resolve relations for valid rows
    if (isBiblio) {
      await this.resolveBibliographyRelations(batchId);
    } else {
      await this.resolveItemRelations(batchId);
    }

    return { totalRows: dataLines.length, validRows: validCount, invalidRows: invalidCount };
  }

  private async resolveBibliographyRelations(batchId: string) {
    const validRows = await db.query.importBibliographyRows.findMany({
      where: and(eq(importBibliographyRows.batchId, batchId), eq(importBibliographyRows.status, "valid")),
    });

    for (const row of validRows) {
      const raw = row.rawData as Record<string, string>;
      const resolved: Record<string, any> = { ...raw };

      if (raw.authors) resolved._parsedAuthors = parseAngleBracketMultiValue(raw.authors);
      if (raw.topics) resolved._parsedSubjects = parseAngleBracketMultiValue(raw.topics);
      if (raw.item_code) resolved._parsedItemCodes = parseAngleBracketMultiValue(raw.item_code);

      if (raw.gmd_name) {
        const gmd = await db.query.gmds.findFirst({ where: eq(gmds.name, raw.gmd_name.trim()) });
        resolved._gmdId = gmd?.id || null;
      }
      if (raw.language_name) {
        const lang = await db.query.languages.findFirst({ where: eq(languages.name, raw.language_name.trim()) });
        resolved._languageId = lang?.id || null;
      }
      if (raw.publisher_name) {
        const pub = await db.query.publishers.findFirst({ where: eq(publishers.normalizedName, normalizeName(raw.publisher_name)) });
        resolved._publisherId = pub?.id || null;
      }
      if (raw.place_name) {
        const place = await db.query.publicationPlaces.findFirst({ where: eq(publicationPlaces.normalizedName, normalizeName(raw.place_name)) });
        resolved._placeId = place?.id || null;
      }

      await db.update(importBibliographyRows).set({ resolvedData: resolved }).where(eq(importBibliographyRows.id, row.id));
    }
  }

  private async resolveItemRelations(batchId: string) {
    const validRows = await db.query.importItemRows.findMany({
      where: and(eq(importItemRows.batchId, batchId), eq(importItemRows.status, "valid")),
    });

    for (const row of validRows) {
      const raw = row.rawData as Record<string, string>;
      const resolved: Record<string, any> = { ...raw };

      if (raw.location_name) {
        const loc = await db.query.locations.findFirst({ where: eq(locations.room, raw.location_name.trim()) });
        resolved._locationId = loc?.id || null;
      }
      if (raw.coll_type_name) {
        const ct = await db.query.collectionTypes.findFirst({ where: eq(collectionTypes.name, raw.coll_type_name.trim()) });
        resolved._collectionTypeId = ct?.id || null;
      }

      await db.update(importItemRows).set({ resolvedData: resolved }).where(eq(importItemRows.id, row.id));
    }
  }

  async previewBatch(batchId: string, limit = 20) {
    const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) });
    if (!batch) throw new Error("Batch not found");

    let rows: any[] = [];
    if (batch.type === "bibliography") {
      rows = await db.query.importBibliographyRows.findMany({
        where: eq(importBibliographyRows.batchId, batchId),
        limit,
      });
    } else {
      rows = await db.query.importItemRows.findMany({
        where: eq(importItemRows.batchId, batchId),
        limit,
      });
    }

    const errorRows = await db.query.importErrors.findMany({
      where: eq(importErrors.batchId, batchId),
    });

    return {
      batch: { id: batch.id, type: batch.type, status: batch.status, totalRows: batch.totalRows, validRows: batch.validRows, invalidRows: batch.invalidRows },
      preview: rows,
      errors: errorRows.map(r => ({ rowNumber: r.rowNumber, errors: r.errors })),
    };
  }

  async approveBatch(batchId: string, userId: string) {
    const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) });
    if (!batch) throw new Error("Batch not found");
    if (batch.status !== "preview") throw new Error("Batch not in preview state");

    await db.update(importBatches).set({ status: "approved" }).where(eq(importBatches.id, batchId));

    if (batch.type === "bibliography") {
      return this.commitBibliographyBatch(batchId);
    }
    if (batch.type === "item") {
      return this.commitItemBatch(batchId);
    }

    throw new Error("Unknown batch type");
  }

  private async commitBibliographyBatch(batchId: string) {
    const validRows = await db.query.importBibliographyRows.findMany({
      where: and(eq(importBibliographyRows.batchId, batchId), eq(importBibliographyRows.status, "valid")),
    });

    let committedCount = 0;
    let duplicateCount = 0;

    for (const row of validRows) {
      const resolved = row.resolvedData as any;
      try {
        await db.transaction(async (tx) => {
          const existing = await tx.query.bibliographies.findFirst({
            where: and(eq(bibliographies.title, resolved.title), isNull(bibliographies.deletedAt)),
          });

          let bibliographyId: string;
          if (existing) {
            bibliographyId = existing.id;
            duplicateCount++;
          } else {
            const [bib] = await tx.insert(bibliographies).values({
              title: resolved.title,
              isbnIssn: resolved.isbn_issn || null,
              edition: resolved.edition || null,
              publishYear: resolved.publish_year ? parseInt(resolved.publish_year) : null,
              collation: resolved.collation || null,
              seriesTitle: resolved.series_title || null,
              callNumber: resolved.call_number || null,
              classification: resolved.classification || null,
              notes: resolved.notes || null,
              sor: resolved.sor || null,
              image: resolved.image || null,
              gmdId: resolved._gmdId || null,
              languageId: resolved._languageId || null,
              publisherId: resolved._publisherId || null,
              publicationPlaceId: resolved._placeId || null,
              stock: 0,
            }).returning();
            bibliographyId = bib.id;
          }

          if (resolved._parsedAuthors?.length > 0) {
            await tx.delete(bibliographyAuthors).where(eq(bibliographyAuthors.bibliographyId, bibliographyId));
            for (const authorName of resolved._parsedAuthors) {
              const norm = normalizeName(authorName);
              let author = await tx.query.authors.findFirst({ where: eq(authors.normalizedName, norm) });
              if (!author) {
                [author] = await tx.insert(authors).values({ name: authorName.trim(), normalizedName: norm }).returning();
              }
              await tx.insert(bibliographyAuthors).values({ bibliographyId, authorId: author.id, role: "primary" });
            }
          }

          if (resolved._parsedSubjects?.length > 0) {
            await tx.delete(bibliographySubjects).where(eq(bibliographySubjects.bibliographyId, bibliographyId));
            for (const subjectName of resolved._parsedSubjects) {
              const norm = normalizeName(subjectName);
              let subject = await tx.query.subjects.findFirst({ where: eq(subjects.normalizedName, norm) });
              if (!subject) {
                [subject] = await tx.insert(subjects).values({ name: subjectName.trim(), normalizedName: norm }).returning();
              }
              await tx.insert(bibliographySubjects).values({ bibliographyId, subjectId: subject.id });
            }
          }

          await db.update(importBibliographyRows).set({ status: "committed", resolvedId: bibliographyId }).where(eq(importBibliographyRows.id, row.id));
          committedCount++;
        });
      } catch (err) {
        await db.insert(importErrors).values({
          batchId,
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          errors: [err instanceof Error ? err.message : "Unknown commit error"],
        });
        await db.update(importBibliographyRows).set({ status: "invalid" }).where(eq(importBibliographyRows.id, row.id));
      }
    }

    await db.update(importBatches).set({
      status: "committed",
      committedRows: committedCount,
      duplicateRows: duplicateCount,
      committedAt: new Date(),
    }).where(eq(importBatches.id, batchId));

    return { committedRows: committedCount, duplicateRows: duplicateCount };
  }

  private async commitItemBatch(batchId: string) {
    const validRows = await db.query.importItemRows.findMany({
      where: and(eq(importItemRows.batchId, batchId), eq(importItemRows.status, "valid")),
    });

    let committedCount = 0;
    let duplicateCount = 0;

    for (const row of validRows) {
      const resolved = row.resolvedData as any;
      try {
        await db.transaction(async (tx) => {
          const bib = await tx.query.bibliographies.findFirst({
            where: and(eq(bibliographies.title, resolved.title), isNull(bibliographies.deletedAt)),
          });
          if (!bib) throw new Error(`Bibliography "${resolved.title}" not found`);

          const existingItem = await tx.query.items.findFirst({
            where: eq(items.itemCode, resolved.item_code),
          });
          if (existingItem) {
            duplicateCount++;
            await db.update(importItemRows).set({ status: "duplicate" }).where(eq(importItemRows.id, row.id));
            return;
          }

          const [item] = await tx.insert(items).values({
            bibliographyId: bib.id,
            itemCode: resolved.item_code,
            callNumber: resolved.call_number || null,
            inventoryCode: resolved.inventory_code || null,
            locationId: resolved._locationId || 1,
            collectionTypeId: resolved._collectionTypeId || null,
            source: resolved.source || null,
            site: resolved.site || null,
            price: resolved.price ? resolved.price.toString() : null,
            priceCurrency: resolved.price_currency || "IDR",
            status: "available",
            qrToken: crypto.randomBytes(20).toString("hex"),
            qrVersion: 1,
            qrGeneratedAt: new Date(),
          }).returning();

          await syncCollectionAvailableStock(tx, bib.id);
          await db.update(importItemRows).set({ status: "committed", resolvedId: item.id }).where(eq(importItemRows.id, row.id));
          committedCount++;
        });
      } catch (err) {
        await db.insert(importErrors).values({
          batchId,
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          errors: [err instanceof Error ? err.message : "Unknown commit error"],
        });
        await db.update(importItemRows).set({ status: "invalid" }).where(eq(importItemRows.id, row.id));
      }
    }

    await db.update(importBatches).set({
      status: "committed",
      committedRows: committedCount,
      duplicateRows: duplicateCount,
      committedAt: new Date(),
    }).where(eq(importBatches.id, batchId));

    return { committedRows: committedCount, duplicateRows: duplicateCount };
  }

  async downloadErrors(batchId: string): Promise<string> {
    const errorRows = await db.query.importErrors.findMany({
      where: eq(importErrors.batchId, batchId),
      orderBy: (r, { asc }) => [asc(r.rowNumber)],
    });

    const header = "row_number,errors,raw_data";
    const csvRows = errorRows.map(r => {
      const errors = Array.isArray(r.errors) ? r.errors.join("; ") : String(r.errors);
      const rawJson = JSON.stringify(r.rawData).replace(/"/g, '""');
      return `${r.rowNumber},"${errors.replace(/"/g, '""')}","${rawJson}"`;
    });

    return [header, ...csvRows].join("\n");
  }

  async listBatches() {
    return db.query.importBatches.findMany({
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }

  async getBatch(batchId: string) {
    return db.query.importBatches.findFirst({
      where: eq(importBatches.id, batchId),
    });
  }
}

export const importService = new ImportService();
