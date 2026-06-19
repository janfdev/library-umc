import { db } from "../../../db";
import {
  importBatches, importBibliographyRows, importItemRows, importErrors,
  bibliographies, items, bibliographyAuthors, bibliographySubjects,
  authors, subjects, publishers, publicationPlaces, gmds, collectionTypes,
  languages, locations, vendors
} from "../../../db/schema";
import { eq, and, isNull, sql, asc } from "drizzle-orm";
import { syncCollectionAvailableStock } from "../../shared/utils/stock-sync";
import crypto from "crypto";

// ==========================================
// CSV PARSING UTILITIES
// ==========================================

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parse angle-bracket multi-value: <Value1><Value2> → ["Value1", "Value2"]
 * Handles the Senayan/SLiMS format used in both bibliography and item CSVs.
 */
function parseAngleBracketMultiValue(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  const matches = raw.match(/<([^>]+)>/g);
  if (!matches) return [raw.trim()].filter(s => s.length > 0);
  return matches.map(m => m.slice(1, -1).trim()).filter(s => s.length > 0);
}

/**
 * Detect delimiter from first line
 */
function detectDelimiter(raw: string): ";" | "," {
  const firstLine = raw.split("\n")[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

/**
 * RFC-compatible CSV line parser that handles quoted fields with semicolons
 */
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

/**
 * Remove UTF-8 BOM if present
 */
function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);
  return text;
}

/**
 * Generate SHA-256 checksum of file content
 */
function checksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// ==========================================
// IMPORT SERVICE
// ==========================================

export class ImportService {

  // ==========================================
  // BATCH MANAGEMENT
  // ==========================================

  async createBatch(type: "bibliography" | "item", filename: string, userId: string, fileContent: string) {
    const sha = checksum(fileContent);
    const [batch] = await db.insert(importBatches).values({
      type,
      filename,
      status: "uploading",
      createdBy: userId,
      metadata: { fileContent, checksum: sha, fileSize: fileContent.length },
    }).returning();
    return batch;
  }

  async getBatch(batchId: string) {
    return db.query.importBatches.findFirst({
      where: eq(importBatches.id, batchId),
    });
  }

  async listBatches() {
    return db.query.importBatches.findMany({
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });
  }

  // ==========================================
  // PARSING
  // ==========================================

  async parseBatch(batchId: string) {
    const batch = await db.query.importBatches.findFirst({
      where: eq(importBatches.id, batchId),
    });
    if (!batch) throw new Error("Batch not found");
    if (batch.status !== "uploading" && batch.status !== "parsing") {
      throw new Error(`Batch is in '${batch.status}' state, cannot parse`);
    }

    await db.update(importBatches).set({ status: "parsing" }).where(eq(importBatches.id, batchId));

    const fileContent = (batch.metadata as any)?.fileContent;
    if (!fileContent) throw new Error("No file content in batch metadata");

    const cleanContent = stripBom(fileContent);
    const delimiter = detectDelimiter(cleanContent);
    const lines = cleanContent.split("\n").filter((l: string) => l.trim().length > 0);

    if (lines.length < 2) {
      await db.update(importBatches).set({
        status: "failed",
        metadata: { ...batch.metadata as any, error: "No data rows found" }
      }).where(eq(importBatches.id, batchId));
      return { totalRows: 0, parsedRows: 0, errors: ["No data rows found"] };
    }

    const headers = parseCsvLine(lines[0], delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const dataLines = lines.slice(1);

    // Clear old rows for this batch
    const isBiblio = batch.type === "bibliography";
    if (isBiblio) {
      await db.delete(importBibliographyRows).where(eq(importBibliographyRows.batchId, batchId));
    } else {
      await db.delete(importItemRows).where(eq(importItemRows.batchId, batchId));
    }
    await db.delete(importErrors).where(eq(importErrors.batchId, batchId));

    // Parse in chunks of 500
    const chunkSize = 500;
    let parsedCount = 0;

    for (let i = 0; i < dataLines.length; i += chunkSize) {
      const chunk = dataLines.slice(i, i + chunkSize);
      const rows: any[] = [];

      for (let j = 0; j < chunk.length; j++) {
        const line = chunk[j];
        const values = parseCsvLine(line, delimiter);
        const rawData: Record<string, string> = {};
        headers.forEach((h, hi) => { rawData[h] = (values[hi] || "").trim(); });

        rows.push({
          batchId,
          rowNumber: i + j + 1,
          rawData,
          status: "pending" as const,
        });
        parsedCount++;
      }

      if (rows.length > 0) {
        if (isBiblio) {
          await db.insert(importBibliographyRows).values(rows);
        } else {
          await db.insert(importItemRows).values(rows);
        }
      }
    }

    await db.update(importBatches).set({
      status: "validating",
      totalRows: dataLines.length,
      processedRows: parsedCount,
    }).where(eq(importBatches.id, batchId));

    // Auto-validate after parse
    await this.validateBatch(batchId);

    return { totalRows: dataLines.length, parsedRows: parsedCount };
  }

  // ==========================================
  // VALIDATION
  // ==========================================

  async validateBatch(batchId: string) {
    const batch = await db.query.importBatches.findFirst({
      where: eq(importBatches.id, batchId),
    });
    if (!batch) throw new Error("Batch not found");

    const isBiblio = batch.type === "bibliography";

    if (isBiblio) {
      return this.validateBibliographyBatch(batchId);
    } else {
      return this.validateItemBatch(batchId);
    }
  }

  private async validateBibliographyBatch(batchId: string) {
    const rows = await db.query.importBibliographyRows.findMany({
      where: eq(importBibliographyRows.batchId, batchId),
    });

    let validCount = 0;
    let invalidCount = 0;
    let warningCount = 0;

    for (const row of rows) {
      const raw = row.rawData as Record<string, string>;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Required: title
      if (!raw.title || raw.title.trim().length === 0) {
        errors.push("title is required");
      }

      // Parse authors
      const parsedAuthors = raw.authors ? parseAngleBracketMultiValue(raw.authors) : [];
      if (raw.authors && parsedAuthors.length === 0) {
        warnings.push("authors field present but no valid authors parsed");
      }

      // Parse topics
      const parsedTopics = raw.topics ? parseAngleBracketMultiValue(raw.topics) : [];
      if (raw.topics && parsedTopics.length === 0) {
        warnings.push("topics field present but no valid topics parsed");
      }

      // Parse item codes (mapping evidence)
      const parsedItemCodes = raw.item_code ? parseAngleBracketMultiValue(raw.item_code) : [];

      // Publish year validation
      if (raw.publish_year && raw.publish_year.trim() !== "") {
        const year = parseInt(raw.publish_year);
        if (isNaN(year) || year < 1000 || year > 9999) {
          warnings.push(`invalid publish_year: ${raw.publish_year}`);
        }
      }

      // Resolve relations
      const resolvedData: Record<string, any> = { ...raw };
      resolvedData._parsedAuthors = parsedAuthors;
      resolvedData._parsedTopics = parsedTopics;
      resolvedData._parsedItemCodes = parsedItemCodes;

      // Resolve GMD
      if (raw.gmd_name && raw.gmd_name.trim()) {
        const gmd = await db.query.gmds.findFirst({ where: eq(gmds.name, raw.gmd_name.trim()) });
        resolvedData._gmdId = gmd?.id || null;
        if (!gmd) warnings.push(`GMD "${raw.gmd_name}" not found`);
      }

      // Resolve language
      if (raw.language_name && raw.language_name.trim()) {
        const lang = await db.query.languages.findFirst({ where: eq(languages.name, raw.language_name.trim()) });
        resolvedData._languageId = lang?.id || null;
        if (!lang) warnings.push(`Language "${raw.language_name}" not found`);
      }

      // Resolve publisher
      if (raw.publisher_name && raw.publisher_name.trim()) {
        const pub = await db.query.publishers.findFirst({
          where: eq(publishers.normalizedName, normalizeName(raw.publisher_name))
        });
        resolvedData._publisherId = pub?.id || null;
      }

      // Resolve place
      if (raw.place_name && raw.place_name.trim()) {
        const place = await db.query.publicationPlaces.findFirst({
          where: eq(publicationPlaces.normalizedName, normalizeName(raw.place_name))
        });
        resolvedData._placeId = place?.id || null;
      }

      // Determine status
      let status: "valid" | "invalid" | "pending" = "valid";
      if (errors.length > 0) {
        status = "invalid";
        invalidCount++;
      } else {
        validCount++;
        if (warnings.length > 0) warningCount++;
      }

      // Insert errors into errors table
      if (errors.length > 0) {
        await db.insert(importErrors).values({
          batchId: batchId,
          rowNumber: row.rowNumber,
          rawData: raw,
          errors: errors,
        });
      }

      await db.update(importBibliographyRows).set({
        status,
        resolvedData: { ...resolvedData, _warnings: warnings.length > 0 ? warnings : undefined },
      }).where(eq(importBibliographyRows.id, row.id));
    }

    await db.update(importBatches).set({
      status: "preview",
      validRows: validCount,
      invalidRows: invalidCount,
    }).where(eq(importBatches.id, batchId));

    return { totalRows: rows.length, validRows: validCount, invalidRows: invalidCount, warningRows: warningCount };
  }

  private async validateItemBatch(batchId: string) {
    const rows = await db.query.importItemRows.findMany({
      where: eq(importItemRows.batchId, batchId),
    });

    let validCount = 0;
    let invalidCount = 0;

    for (const row of rows) {
      const raw = row.rawData as Record<string, string>;
      const errors: string[] = [];

      // Required: item_code
      if (!raw.item_code || raw.item_code.trim().length === 0) {
        errors.push("item_code is required");
      }

      // Resolve relations
      const resolvedData: Record<string, any> = { ...raw };

      // Resolve location
      if (raw.location_name && raw.location_name.trim()) {
        const loc = await db.query.locations.findFirst({
          where: eq(locations.room, raw.location_name.trim())
        });
        resolvedData._locationId = loc?.id || null;
      }

      // Resolve collection type
      if (raw.coll_type_name && raw.coll_type_name.trim()) {
        const ct = await db.query.collectionTypes.findFirst({
          where: eq(collectionTypes.name, raw.coll_type_name.trim())
        });
        resolvedData._collectionTypeId = ct?.id || null;
      }

      // Resolve vendor
      if (raw.supplier_name && raw.supplier_name.trim()) {
        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.name, raw.supplier_name.trim())
        });
        resolvedData._vendorId = vendor?.id || null;
      }

      // Status mapping
      const statusMap: Record<string, string> = {
        "available": "available",
        "tersedia": "available",
        "loaned": "loaned",
        "dipinjam": "loaned",
        "damaged": "damaged",
        "rusak": "damaged",
        "lost": "lost",
        "hilang": "lost",
        "missing": "lost",
        "in processing": "available",
        "dalam proses": "available",
      };
      const rawStatus = (raw.item_status_name || "").toLowerCase().trim();
      resolvedData._mappedStatus = statusMap[rawStatus] || null;
      if (rawStatus && !statusMap[rawStatus]) {
        errors.push(`unknown item_status_name: ${raw.item_status_name}`);
      }

      // Price parsing
      if (raw.price && raw.price.trim() !== "" && raw.price !== "0" && raw.price !== "1") {
        const price = parseFloat(raw.price);
        if (isNaN(price)) {
          errors.push(`invalid price: ${raw.price}`);
        } else {
          resolvedData._parsedPrice = price;
        }
      }

      let status: "valid" | "invalid" = "valid";
      if (errors.length > 0) {
        status = "invalid";
        invalidCount++;
      } else {
        validCount++;
      }

      // Insert errors into errors table
      if (errors.length > 0) {
        await db.insert(importErrors).values({
          batchId: batchId,
          rowNumber: row.rowNumber,
          rawData: raw,
          errors: errors,
        });
      }

      await db.update(importItemRows).set({
        status,
        resolvedData,
      }).where(eq(importItemRows.id, row.id));
    }

    await db.update(importBatches).set({
      status: "preview",
      validRows: validCount,
      invalidRows: invalidCount,
    }).where(eq(importBatches.id, batchId));

    return { totalRows: rows.length, validRows: validCount, invalidRows: invalidCount };
  }

  // ==========================================
  // PREVIEW
  // ==========================================

  async previewBatch(batchId: string, limit = 20, offset = 0) {
    const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) });
    if (!batch) throw new Error("Batch not found");

    let rows: any[] = [];
    let totalCount = 0;

    if (batch.type === "bibliography") {
      rows = await db.query.importBibliographyRows.findMany({
        where: eq(importBibliographyRows.batchId, batchId),
        limit,
      });
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(importBibliographyRows)
        .where(eq(importBibliographyRows.batchId, batchId));
      totalCount = Number(countResult[0]?.count || 0);
    } else {
      rows = await db.query.importItemRows.findMany({
        where: eq(importItemRows.batchId, batchId),
        limit,
      });
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(importItemRows)
        .where(eq(importItemRows.batchId, batchId));
      totalCount = Number(countResult[0]?.count || 0);
    }

    const errorRows = await db.query.importErrors.findMany({
      where: eq(importErrors.batchId, batchId),
    });

    return {
      batch: {
        id: batch.id,
        type: batch.type,
        status: batch.status,
        totalRows: batch.totalRows,
        validRows: batch.validRows,
        invalidRows: batch.invalidRows,
      },
      rows,
      errors: errorRows,
      pagination: { total: totalCount, limit, offset },
    };
  }

  async getErrors(batchId: string) {
    return db.query.importErrors.findMany({
      where: eq(importErrors.batchId, batchId),
      orderBy: (r, { asc }) => [asc(r.rowNumber)],
    });
  }

  async downloadErrorsCsv(batchId: string): Promise<string> {
    const errorRows = await this.getErrors(batchId);
    const header = "row_number,errors,raw_data";
    const csvRows = errorRows.map(r => {
      const errors = Array.isArray(r.errors) ? r.errors.join("; ") : String(r.errors);
      const rawJson = JSON.stringify(r.rawData).replace(/"/g, '""');
      return `${r.rowNumber},"${errors.replace(/"/g, '""')}","${rawJson}"`;
    });
    return [header, ...csvRows].join("\n");
  }

  // ==========================================
  // APPROVAL
  // ==========================================

  async approveBatch(batchId: string, userId: string) {
    const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) });
    if (!batch) throw new Error("Batch not found");
    if (batch.status !== "preview") throw new Error(`Batch is in '${batch.status}' state, cannot approve`);

    await db.update(importBatches).set({ status: "approving" }).where(eq(importBatches.id, batchId));

    if (batch.type === "bibliography") {
      return this.commitBibliographyBatch(batchId, userId);
    } else if (batch.type === "item") {
      return this.commitItemBatch(batchId, userId);
    } else {
      throw new Error("Unknown batch type");
    }
  }

  private async commitBibliographyBatch(batchId: string, userId: string) {
    const validRows = await db.query.importBibliographyRows.findMany({
      where: and(eq(importBibliographyRows.batchId, batchId), eq(importBibliographyRows.status, "valid")),
    });

    let committedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      const resolved = row.resolvedData as any;
      try {
        await db.transaction(async (tx) => {
          // Resolve or create publisher
          let publisherId = resolved._publisherId;
          if (!publisherId && resolved.publisher_name?.trim()) {
            const norm = normalizeName(resolved.publisher_name);
            let pub = await tx.query.publishers.findFirst({ where: eq(publishers.normalizedName, norm) });
            if (!pub) {
              [pub] = await tx.insert(publishers).values({
                name: resolved.publisher_name.trim(),
                normalizedName: norm,
              }).returning();
            }
            publisherId = pub.id;
          }

          // Resolve or create place
          let placeId = resolved._placeId;
          if (!placeId && resolved.place_name?.trim()) {
            const norm = normalizeName(resolved.place_name);
            let place = await tx.query.publicationPlaces.findFirst({ where: eq(publicationPlaces.normalizedName, norm) });
            if (!place) {
              [place] = await tx.insert(publicationPlaces).values({
                name: resolved.place_name.trim(),
                normalizedName: norm,
              }).returning();
            }
            placeId = place.id;
          }

          // Check for existing bibliography (by title)
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
              publisherId: publisherId || null,
              publicationPlaceId: placeId || null,
              stock: 0,
            }).returning();
            bibliographyId = bib.id;
          }

          // Sync authors
          if (resolved._parsedAuthors?.length > 0) {
            await tx.delete(bibliographyAuthors).where(eq(bibliographyAuthors.bibliographyId, bibliographyId));
            for (const authorName of resolved._parsedAuthors) {
              const norm = normalizeName(authorName);
              let author = await tx.query.authors.findFirst({ where: eq(authors.normalizedName, norm) });
              if (!author) {
                [author] = await tx.insert(authors).values({
                  name: authorName.trim(),
                  normalizedName: norm,
                }).returning();
              }
              await tx.insert(bibliographyAuthors).values({
                bibliographyId,
                authorId: author.id,
                role: "primary",
              });
            }
          }

          // Sync subjects
          if (resolved._parsedTopics?.length > 0) {
            await tx.delete(bibliographySubjects).where(eq(bibliographySubjects.bibliographyId, bibliographyId));
            for (const topicName of resolved._parsedTopics) {
              const norm = normalizeName(topicName);
              let subject = await tx.query.subjects.findFirst({ where: eq(subjects.normalizedName, norm) });
              if (!subject) {
                [subject] = await tx.insert(subjects).values({
                  name: topicName.trim(),
                  normalizedName: norm,
                }).returning();
              }
              await tx.insert(bibliographySubjects).values({
                bibliographyId,
                subjectId: subject.id,
              });
            }
          }

          // Mark row committed
          await db.update(importBibliographyRows).set({
            status: "committed",
            resolvedId: bibliographyId,
          }).where(eq(importBibliographyRows.id, row.id));

          committedCount++;
        });
      } catch (err: any) {
        errorCount++;
        await db.insert(importErrors).values({
          batchId,
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          errors: [err.message?.substring(0, 500) || "Unknown error"],
        });
        await db.update(importBibliographyRows).set({
          status: "invalid",
        }).where(eq(importBibliographyRows.id, row.id));
      }
    }

    await db.update(importBatches).set({
      status: "committed",
      committedRows: committedCount,
      duplicateRows: duplicateCount,
      invalidRows: errorCount,
      committedAt: new Date(),
    }).where(eq(importBatches.id, batchId));

    return { committedRows: committedCount, duplicateRows: duplicateCount, errorRows: errorCount };
  }

  private async commitItemBatch(batchId: string, userId: string) {
    const validRows = await db.query.importItemRows.findMany({
      where: and(eq(importItemRows.batchId, batchId), eq(importItemRows.status, "valid")),
    });

    let committedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      const resolved = row.resolvedData as any;
      try {
        await db.transaction(async (tx) => {
          // Resolve bibliography by title
          const bib = await tx.query.bibliographies.findFirst({
            where: and(eq(bibliographies.title, resolved.title), isNull(bibliographies.deletedAt)),
          });
          if (!bib) {
            throw new Error(`Bibliography "${resolved.title}" not found`);
          }

          // Check duplicate item_code
          const existingItem = await tx.query.items.findFirst({
            where: eq(items.itemCode, resolved.item_code),
          });
          if (existingItem) {
            duplicateCount++;
            await db.update(importItemRows).set({ status: "duplicate" as any })
              .where(eq(importItemRows.id, row.id));
            return;
          }

          // Generate QR token
          const qrToken = crypto.randomBytes(20).toString("hex");

          // Insert item
          const [item] = await tx.insert(items).values({
            bibliographyId: bib.id,
            itemCode: resolved.item_code,
            inventoryCode: resolved.inventory_code || null,
            callNumber: resolved.call_number || null,
            locationId: resolved._locationId || 1,
            collectionTypeId: resolved._collectionTypeId || null,
            vendorId: resolved._vendorId || null,
            receivedDate: resolved.received_date || null,
            orderNo: resolved.order_no || null,
            orderDate: resolved.order_date || null,
            status: (resolved._mappedStatus || "available") as any,
            site: resolved.site || null,
            source: resolved.source || null,
            invoice: resolved.invoice || null,
            price: resolved._parsedPrice ? String(resolved._parsedPrice) : null,
            priceCurrency: resolved.price_currency || "IDR",
            invoiceDate: resolved.invoice_date || null,
            qrToken,
            qrVersion: 1,
            qrGeneratedAt: new Date(),
          }).returning();

          // Sync stock
          await syncCollectionAvailableStock(tx, bib.id);

          // Mark committed
          await db.update(importItemRows).set({
            status: "committed",
            resolvedId: item.id,
          }).where(eq(importItemRows.id, row.id));

          committedCount++;
        });
      } catch (err: any) {
        errorCount++;
        await db.insert(importErrors).values({
          batchId,
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          errors: [err.message?.substring(0, 500) || "Unknown error"],
        });
        await db.update(importItemRows).set({
          status: "invalid",
        }).where(eq(importItemRows.id, row.id));
      }
    }

    await db.update(importBatches).set({
      status: "committed",
      committedRows: committedCount,
      duplicateRows: duplicateCount,
      invalidRows: errorCount,
      committedAt: new Date(),
    }).where(eq(importBatches.id, batchId));

    return { committedRows: committedCount, duplicateRows: duplicateCount, errorRows: errorCount };
  }

  // ==========================================
  // CANCEL
  // ==========================================

  async cancelBatch(batchId: string) {
    const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) });
    if (!batch) throw new Error("Batch not found");
    if (batch.status === "committed") throw new Error("Cannot cancel committed batch");

    await db.update(importBatches).set({ status: "cancelled" as any }).where(eq(importBatches.id, batchId));
    return { success: true };
  }
}

export const importService = new ImportService();
