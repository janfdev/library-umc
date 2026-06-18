import { db } from "../../../db";
import {
  importBatches, importRows, collections, items, collectionAuthors, collectionSubjects,
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

function parseSemicolonMultiValue(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw.split(";").map(s => s.trim()).filter(s => s.length > 0);
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
      filePath: null,
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
    const lines: string[] = fileContent.split("\n").filter((l: string) => l.trim().length > 0);

    if (lines.length < 2) {
      await db.update(importBatches).set({ status: "failed", metadata: { error: "No data rows" } }).where(eq(importBatches.id, batchId));
      return { totalRows: 0, errors: ["No data rows"] };
    }

    const headers = parseCsvLine(lines[0], delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const dataLines = lines.slice(1);

    await db.delete(importRows).where(eq(importRows.batchId, batchId));

    const chunkSize = 500;
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < dataLines.length; i += chunkSize) {
      const chunk = dataLines.slice(i, i + chunkSize);
      const rows: any[] = chunk.map((line: string, idx: number) => {
        const values = parseCsvLine(line, delimiter);
        const rawData: Record<string, string> = {};
        headers.forEach((h, hi) => { rawData[h] = (values[hi] || "").trim(); });

        const errors: string[] = [];
        if (batch.type === "bibliography") {
          if (!rawData.title || rawData.title.length < 1) errors.push("title is required");
        } else {
          if (!rawData.item_code || rawData.item_code.length < 1) errors.push("item_code is required");
        }

        const status = errors.length > 0 ? "invalid" as const : "valid" as const;
        if (errors.length > 0) invalidCount++; else validCount++;

        return {
          batchId,
          rowNumber: i + idx + 1,
          rawData,
          status,
          errors: errors.length > 0 ? errors : null,
        };
      });

      if (rows.length > 0) {
        await db.insert(importRows).values(rows);
      }
    }

    await db.update(importBatches).set({
      status: "validating",
      totalRows: dataLines.length,
      processedRows: dataLines.length,
      validRows: validCount,
      invalidRows: invalidCount,
    }).where(eq(importBatches.id, batchId));

    // Resolve relations for valid rows
    await this.resolveRelations(batchId, batch.type);

    await db.update(importBatches).set({ status: "preview" }).where(eq(importBatches.id, batchId));

    return { totalRows: dataLines.length, validRows: validCount, invalidRows: invalidCount };
  }

  private async resolveRelations(batchId: string, type: string) {
    const validRows = await db.query.importRows.findMany({
      where: and(eq(importRows.batchId, batchId), eq(importRows.status, "valid")),
    });

    for (const row of validRows) {
      const raw = row.rawData as Record<string, string>;
      const resolved: Record<string, any> = { ...raw };

      if (type === "bibliography") {
        // Resolve authors
        if (raw.authors) {
          resolved._parsedAuthors = parseAngleBracketMultiValue(raw.authors);
        }
        // Resolve subjects/topics
        if (raw.topics) {
          resolved._parsedSubjects = parseAngleBracketMultiValue(raw.topics);
        }
        // Resolve item codes
        if (raw.item_code) {
          resolved._parsedItemCodes = parseAngleBracketMultiValue(raw.item_code);
        }
        // Resolve GMD
        if (raw.gmd_name) {
          const gmd = await db.query.gmds.findFirst({ where: eq(gmds.name, raw.gmd_name.trim()) });
          resolved._gmdId = gmd?.id || null;
          if (!gmd) resolved._warnings = [...(resolved._warnings || []), `GMD "${raw.gmd_name}" not found`];
        }
        // Resolve language
        if (raw.language_name) {
          const lang = await db.query.languages.findFirst({ where: eq(languages.name, raw.language_name.trim()) });
          resolved._languageId = lang?.id || null;
        }
        // Resolve publisher
        if (raw.publisher_name) {
          const pub = await db.query.publishers.findFirst({ where: eq(publishers.normalizedName, normalizeName(raw.publisher_name)) });
          resolved._publisherId = pub?.id || null;
        }
        // Resolve place
        if (raw.place_name) {
          const place = await db.query.publicationPlaces.findFirst({ where: eq(publicationPlaces.normalizedName, normalizeName(raw.place_name)) });
          resolved._placeId = place?.id || null;
        }
      }

      if (type === "item") {
        // Resolve location
        if (raw.location_name) {
          const loc = await db.query.locations.findFirst({ where: eq(locations.room, raw.location_name.trim()) });
          resolved._locationId = loc?.id || null;
        }
        // Resolve collection type
        if (raw.coll_type_name) {
          const ct = await db.query.collectionTypes.findFirst({ where: eq(collectionTypes.name, raw.coll_type_name.trim()) });
          resolved._collectionTypeId = ct?.id || null;
        }
      }

      await db.update(importRows).set({ resolvedData: resolved }).where(eq(importRows.id, row.id));
    }
  }

  async previewBatch(batchId: string, limit = 20) {
    const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) });
    if (!batch) throw new Error("Batch not found");

    const rows = await db.query.importRows.findMany({
      where: eq(importRows.batchId, batchId),
      limit,
      orderBy: (r, { asc }) => [asc(r.rowNumber)],
    });

    const errorRows = await db.query.importRows.findMany({
      where: and(eq(importRows.batchId, batchId), eq(importRows.status, "invalid")),
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

    const validRows = await db.query.importRows.findMany({
      where: and(eq(importRows.batchId, batchId), eq(importRows.status, "valid")),
      orderBy: (r, { asc }) => [asc(r.rowNumber)],
    });

    let committedCount = 0;
    let duplicateCount = 0;

    if (batch.type === "bibliography") {
      for (const row of validRows) {
        const resolved = row.resolvedData as any;
        try {
          await db.transaction(async (tx) => {
            // Check duplicate by title
            const existing = await tx.query.collections.findFirst({
              where: and(eq(collections.title, resolved.title), isNull(collections.deletedAt)),
            });

            let collectionId: string;
            if (existing) {
              collectionId = existing.id;
              duplicateCount++;
            } else {
              const [bib] = await tx.insert(collections).values({
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
              collectionId = bib.id;
            }

            // Sync authors
            if (resolved._parsedAuthors && resolved._parsedAuthors.length > 0) {
              await tx.delete(collectionAuthors).where(eq(collectionAuthors.collectionId, collectionId));
              for (const authorName of resolved._parsedAuthors) {
                const norm = normalizeName(authorName);
                let author = await tx.query.authors.findFirst({ where: eq(authors.normalizedName, norm) });
                if (!author) {
                  [author] = await tx.insert(authors).values({ name: authorName.trim(), normalizedName: norm }).returning();
                }
                await tx.insert(collectionAuthors).values({ collectionId, authorId: author.id, role: "primary" });
              }
            }

            // Sync subjects
            if (resolved._parsedSubjects && resolved._parsedSubjects.length > 0) {
              await tx.delete(collectionSubjects).where(eq(collectionSubjects.collectionId, collectionId));
              for (const subjectName of resolved._parsedSubjects) {
                const norm = normalizeName(subjectName);
                let subject = await tx.query.subjects.findFirst({ where: eq(subjects.normalizedName, norm) });
                if (!subject) {
                  [subject] = await tx.insert(subjects).values({ name: subjectName.trim(), normalizedName: norm }).returning();
                }
                await tx.insert(collectionSubjects).values({ collectionId, subjectId: subject.id });
              }
            }

            await db.update(importRows).set({ status: "committed", resolvedId: collectionId }).where(eq(importRows.id, row.id));
            committedCount++;
          });
        } catch (err) {
          await db.update(importRows).set({
            status: "invalid",
            errors: [err instanceof Error ? err.message : "Unknown commit error"],
          }).where(eq(importRows.id, row.id));
        }
      }
    }

    if (batch.type === "item") {
      for (const row of validRows) {
        const resolved = row.resolvedData as any;
        try {
          await db.transaction(async (tx) => {
            // Find bibliography by title
            const bib = await tx.query.collections.findFirst({
              where: and(eq(collections.title, resolved.title), isNull(collections.deletedAt)),
            });
            if (!bib) throw new Error(`Bibliography "${resolved.title}" not found`);

            // Check duplicate item_code
            const existingItem = await tx.query.items.findFirst({
              where: eq(items.itemCode, resolved.item_code),
            });
            if (existingItem) {
              duplicateCount++;
              await db.update(importRows).set({ status: "duplicate" }).where(eq(importRows.id, row.id));
              return;
            }

            const [item] = await tx.insert(items).values({
              collectionId: bib.id,
              itemCode: resolved.item_code,
              barcode: resolved.item_code,
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
            await db.update(importRows).set({ status: "committed", resolvedId: item.id }).where(eq(importRows.id, row.id));
            committedCount++;
          });
        } catch (err) {
          await db.update(importRows).set({
            status: "invalid",
            errors: [err instanceof Error ? err.message : "Unknown commit error"],
          }).where(eq(importRows.id, row.id));
        }
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
    const errorRows = await db.query.importRows.findMany({
      where: and(eq(importRows.batchId, batchId), eq(importRows.status, "invalid")),
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
