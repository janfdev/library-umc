import { db } from "../../../db";
import { collections, categories, items, locations } from "../../../db/schema";
import { uploadToCloudinary } from "../../../utils/upload";
import { eq, ne, or, ilike, and, isNull, sql, inArray } from "drizzle-orm";
import ExcelJS from "exceljs";
import { Readable } from "stream";
import {
  importCollectionRowSchema,
  type ImportCollectionRow
} from "../validation/collection.validation";

type CollectionData = {
  coverImageUrl?: string;
  title?: string;
  author?: string;
  publisher?: string;
  publicationYear?: string;
  isbn?: string;
  type?: "physical_book" | "ebook" | "journal" | "thesis";
  categoryId?: number;
  description?: string;
  stock?: number;
};

type ImportRowError = {
  row: number;
  errors: string[];
};

type NormalizedImportRow = ImportCollectionRow & { rowNumber: number };

const IMPORT_HEADERS = [
  "Title",
  "ISBN",
  "Author",
  "Publisher",
  "PublicationYear",
  "Type",
  "CategoryId",
  "Description",
  "Stock"
] as const;

const REQUIRED_IMPORT_HEADERS = [
  "title",
  "author",
  "publisher",
  "publicationyear",
  "type",
  "categoryid"
] as const;

const IMPORT_HEADER_ALIAS: Record<string, string[]> = {
  title: ["title", "judul"],
  isbn: ["isbn"],
  author: ["author", "penulis"],
  publisher: ["publisher", "penerbit"],
  publicationyear: [
    "publicationyear",
    "publication_year",
    "tahunpublikasi",
    "tahun"
  ],
  type: ["type", "jenis"],
  categoryid: ["categoryid", "category_id", "kategoriid", "category"],
  description: ["description", "deskripsi"],
  stock: ["stock", "jumlah", "quantity"]
};

export class CollectionService {
  private normalizeHeader(value: unknown) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  private getCellString(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return String(value.getFullYear());
    }

    if (typeof value === "object") {
      if ("text" in value && typeof value.text === "string") {
        return value.text.trim();
      }
      if ("result" in value && value.result !== undefined) {
        return String(value.result).trim();
      }
      if (
        "richText" in value &&
        Array.isArray(value.richText) &&
        value.richText.length > 0
      ) {
        return value.richText
          .map((item: { text?: string }) => item.text ?? "")
          .join("")
          .trim();
      }
    }

    return String(value).trim();
  }

  private getHeaderMap(worksheet: ExcelJS.Worksheet) {
    const headerRow = worksheet.getRow(1);
    const indexMap: Record<string, number> = {};

    for (let col = 1; col <= headerRow.cellCount; col++) {
      const normalized = this.normalizeHeader(headerRow.getCell(col).value);
      if (!normalized) {
        continue;
      }

      for (const [canonical, aliases] of Object.entries(IMPORT_HEADER_ALIAS)) {
        if (aliases.includes(normalized) && indexMap[canonical] === undefined) {
          indexMap[canonical] = col;
        }
      }
    }

    const missingRequiredHeaders = REQUIRED_IMPORT_HEADERS.filter(
      (header) => indexMap[header] === undefined
    );

    return { indexMap, missingRequiredHeaders };
  }

  private readWorkbookFromUpload(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    const ext = file.originalname.toLowerCase();
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      ext.endsWith(".csv");
    const isXlsx =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      ext.endsWith(".xlsx");

    if (!isCsv && !isXlsx) {
      throw new Error(
        "Format file tidak didukung. Gunakan file .csv atau .xlsx"
      );
    }

    if (isCsv) {
      return workbook.csv
        .read(Readable.from(file.buffer.toString("utf-8")))
        .then(() => workbook);
    }

    return workbook.xlsx.read(Readable.from(file.buffer)).then(() => workbook);
  }

  private parseImportRows(
    worksheet: ExcelJS.Worksheet,
    indexMap: Record<string, number>
  ) {
    const errors: ImportRowError[] = [];
    const validRows: NormalizedImportRow[] = [];
    const readCell = (row: ExcelJS.Row, key: string) => {
      const index = indexMap[key];
      if (!index) {
        return "";
      }
      return this.getCellString(row.getCell(index).value);
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const raw = {
        title: readCell(row, "title"),
        isbn: readCell(row, "isbn"),
        author: readCell(row, "author"),
        publisher: readCell(row, "publisher"),
        publicationYear: readCell(row, "publicationyear"),
        type: readCell(row, "type"),
        categoryId: readCell(row, "categoryid"),
        description: readCell(row, "description"),
        stock: readCell(row, "stock")
      };

      const isEmptyRow = Object.values(raw).every((value) => value === "");
      if (isEmptyRow) {
        continue;
      }

      const parsed = importCollectionRowSchema.safeParse(raw);
      if (!parsed.success) {
        errors.push({
          row: rowNumber,
          errors: parsed.error.issues.map((issue) => issue.message)
        });
        continue;
      }

      validRows.push({
        ...parsed.data,
        rowNumber
      });
    }

    return { errors, validRows };
  }

  async getCollectionImportTemplateBuffer() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Collections Template");

    worksheet.addRow([...IMPORT_HEADERS]);

    worksheet.getRow(1).font = { bold: true };
    worksheet.columns = [
      { key: "title", width: 30 },
      { key: "isbn", width: 20 },
      { key: "author", width: 24 },
      { key: "publisher", width: 24 },
      { key: "publicationYear", width: 16 },
      { key: "type", width: 16 },
      { key: "categoryId", width: 14 },
      { key: "description", width: 38 },
      { key: "stock", width: 10 }
    ];

    const output = await workbook.xlsx.writeBuffer();
    return Buffer.from(output as ArrayBuffer);
  }

  async importCollectionsFromFile(file: Express.Multer.File) {
    try {
      const workbook = await this.readWorkbookFromUpload(file);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        return {
          success: false,
          message: "File tidak memiliki sheet yang bisa dibaca",
          data: {
            insertedCount: 0,
            totalRows: 0,
            errors: [{ row: 1, errors: ["Worksheet tidak ditemukan"] }]
          }
        };
      }

      const { indexMap, missingRequiredHeaders } = this.getHeaderMap(worksheet);
      if (missingRequiredHeaders.length > 0) {
        return {
          success: false,
          message: "Format header tidak valid",
          data: {
            insertedCount: 0,
            totalRows: 0,
            errors: [
              {
                row: 1,
                errors: [
                  `Header wajib tidak lengkap: ${missingRequiredHeaders.join(", ")}`
                ]
              }
            ]
          }
        };
      }

      const { errors, validRows } = this.parseImportRows(worksheet, indexMap);
      const totalRows = validRows.length + errors.length;

      if (validRows.length === 0) {
        return {
          success: false,
          message: "Tidak ada data valid untuk diimport",
          data: {
            insertedCount: 0,
            totalRows,
            errors:
              errors.length > 0
                ? errors
                : [{ row: 2, errors: ["Data kosong atau tidak valid"] }]
          }
        };
      }

      const isbnRowsMap = new Map<string, number[]>();
      for (const row of validRows) {
        if (!row.isbn) {
          continue;
        }
        const key = row.isbn.trim();
        const rows = isbnRowsMap.get(key) ?? [];
        rows.push(row.rowNumber);
        isbnRowsMap.set(key, rows);
      }

      for (const [isbn, rows] of isbnRowsMap.entries()) {
        if (rows.length > 1) {
          rows.forEach((rowNumber) => {
            errors.push({
              row: rowNumber,
              errors: [`ISBN duplikat dalam file import: ${isbn}`]
            });
          });
        }
      }

      const uniqueIsbn = [...isbnRowsMap.keys()];
      if (uniqueIsbn.length > 0) {
        const existingCollections = await db
          .select({ isbn: collections.isbn })
          .from(collections)
          .where(
            and(
              inArray(collections.isbn, uniqueIsbn),
              isNull(collections.deletedAt)
            )
          );

        const existingSet = new Set(
          existingCollections
            .map((row) => row.isbn)
            .filter((value): value is string => Boolean(value))
        );

        if (existingSet.size > 0) {
          for (const row of validRows) {
            if (row.isbn && existingSet.has(row.isbn.trim())) {
              errors.push({
                row: row.rowNumber,
                errors: [`ISBN sudah ada di database: ${row.isbn}`]
              });
            }
          }
        }
      }

      const categoryIds = [...new Set(validRows.map((row) => row.categoryId))];
      const existingCategories =
        categoryIds.length > 0
          ? await db
              .select({ id: categories.id })
              .from(categories)
              .where(inArray(categories.id, categoryIds))
          : [];
      const categorySet = new Set(
        existingCategories.map((category) => category.id)
      );

      for (const row of validRows) {
        if (!categorySet.has(row.categoryId)) {
          errors.push({
            row: row.rowNumber,
            errors: [`CategoryId tidak ditemukan: ${row.categoryId}`]
          });
        }
      }

      if (errors.length > 0) {
        const dedupedErrors = Array.from(
          new Map(
            errors.map((entry) => [
              `${entry.row}-${entry.errors.join("|")}`,
              entry
            ])
          ).values()
        ).sort((a, b) => a.row - b.row);

        return {
          success: false,
          message: "Import dibatalkan karena ada data tidak valid",
          data: {
            insertedCount: 0,
            totalRows,
            errors: dedupedErrors
          }
        };
      }

      const inserted = await db.transaction(async (tx) => {
        const insertedRows: string[] = [];

        for (const row of validRows) {
          const normalizedType = row.type;
          const targetStock =
            normalizedType === "physical_book" ? Number(row.stock ?? 0) : 0;

          const [newCollection] = await tx
            .insert(collections)
            .values({
              title: row.title,
              isbn: row.isbn?.trim() || null,
              author: row.author,
              publisher: row.publisher,
              publicationYear: row.publicationYear,
              type: normalizedType,
              categoryId: row.categoryId,
              description: row.description,
              image: null,
              stock: 0
            })
            .onConflictDoNothing()
            .returning({ id: collections.id });

          if (!newCollection) {
            continue;
          }

          insertedRows.push(newCollection.id);
          await this.syncItemsWithStock(
            tx,
            newCollection.id,
            Math.max(0, targetStock)
          );
        }

        return insertedRows.length;
      });

      return {
        success: true,
        message: "Import koleksi berhasil",
        data: {
          insertedCount: inserted,
          totalRows,
          errors: []
        }
      };
    } catch (err) {
      console.error("[CollectionService] Error importing collections:", err);
      return {
        success: false,
        message: "Gagal memproses file import",
        data: {
          insertedCount: 0,
          totalRows: 0,
          errors: [
            {
              row: 0,
              errors: [err instanceof Error ? err.message : "Unknown error"]
            }
          ]
        }
      };
    }
  }

  private async syncCollectionAvailableStock(tx: any, collectionId: string) {
    const [availableCount] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(
        and(
          eq(items.collectionId, collectionId),
          eq(items.status, "available"),
          isNull(items.deletedAt)
        )
      );

    await tx
      .update(collections)
      .set({ stock: Number(availableCount?.count ?? 0), updatedAt: new Date() })
      .where(eq(collections.id, collectionId));
  }

  private generateAutoCode(
    prefix: string,
    collectionId: string,
    index: number
  ) {
    const shortId = collectionId.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `${prefix}-${shortId}-${Date.now()}-${index + 1}`;
  }

  private async syncItemsWithStock(
    tx: any,
    collectionId: string,
    targetStock: number
  ) {
    const existingItems = await tx.query.items.findMany({
      where: and(eq(items.collectionId, collectionId), isNull(items.deletedAt))
    });

    const currentStock = existingItems.length;
    if (targetStock === currentStock) {
      await this.syncCollectionAvailableStock(tx, collectionId);
      return;
    }

    if (targetStock > currentStock) {
      const diff = targetStock - currentStock;

      const defaultLocation = await tx.query.locations.findFirst({
        where: isNull(locations.deletedAt)
      });

      if (!defaultLocation) {
        throw new Error(
          "Tidak ada lokasi aktif. Tambahkan lokasi terlebih dahulu sebelum menambah stock."
        );
      }

      const values = Array.from({ length: diff }, (_, idx) => ({
        collectionId,
        locationId: defaultLocation.id,
        status: "available" as const,
        barcode: this.generateAutoCode("AUTO", collectionId, idx),
        uniqueCode: this.generateAutoCode("UC", collectionId, idx)
      }));

      await tx.insert(items).values(values);
    } else {
      const diff = currentStock - targetStock;
      const removableItems = existingItems
        .filter((item: any) => item.status === "available")
        .slice(0, diff);

      if (removableItems.length < diff) {
        throw new Error(
          "Stock tidak bisa dikurangi karena sebagian item sedang dipinjam atau tidak tersedia."
        );
      }

      await Promise.all(
        removableItems.map((item: any) =>
          tx
            .update(items)
            .set({
              deletedAt: new Date(),
              status: "lost",
              updatedAt: new Date()
            })
            .where(eq(items.id, item.id))
        )
      );
    }

    await this.syncCollectionAvailableStock(tx, collectionId);
  }

  // Get All Collections (Search & Filter enabled)
  async getAllCollections(filters?: {
    search?: string;
    categoryId?: number;
    type?: "physical_book" | "ebook" | "journal" | "thesis";
  }) {
    try {
      const { search, categoryId, type } = filters || {};

      const whereConditions: any[] = [isNull(collections.deletedAt)];

      if (search) {
        whereConditions.push(
          or(
            ilike(collections.title, `%${search}%`),
            ilike(collections.author, `%${search}%`),
            ilike(collections.isbn, `%${search}%`)
          )
        );
      }

      if (categoryId) {
        whereConditions.push(eq(collections.categoryId, categoryId));
      }

      if (type) {
        whereConditions.push(eq(collections.type, type));
      }

      const result = await db.query.collections.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          category: true
        },
        orderBy: (collections, { desc }) => [desc(collections.createdAt)],
        limit: 100
      });

      return {
        success: true,
        message: "Get Collections Successfully",
        data: result
      };
    } catch (err) {
      console.error("[CollectionService] Error getting collections:", err);
      return {
        success: false,
        message: "Failed to get collections",
        data: null
      };
    }
  }

  // Create New Collection
  async createCollection(data: CollectionData, file?: Express.Multer.File) {
    try {
      const incomingIsbn = data.isbn?.trim() || null;

      // 1. Validate categoryId
      if (data.categoryId) {
        const category = await db.query.categories.findFirst({
          where: eq(categories.id, data.categoryId)
        });

        if (!category) {
          return {
            success: false,
            message: "Category not found. Please select a valid category.",
            data: null
          };
        }
      }

      // 2. Check for duplicate ISBN (if provided)
      if (incomingIsbn) {
        const existingBook = await db.query.collections.findFirst({
          where: and(
            eq(collections.isbn, incomingIsbn),
            isNull(collections.deletedAt)
          )
        });

        if (existingBook) {
          return {
            success: false,
            message: "A book with this ISBN already exists",
            data: null
          };
        }
      }

      // 3. Upload Cover Image ke Cloudinary (Jika ada)
      let coverImageUrl = null;

      if (file) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          "library/covers"
        );
        coverImageUrl = uploadResult.url;
      }

      const normalizedType = data.type as
        | "physical_book"
        | "ebook"
        | "journal"
        | "thesis"
        | undefined;
      const targetStock =
        normalizedType === "physical_book" ? (data.stock ?? 0) : 0;

      const collectionData = {
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        publicationYear: data.publicationYear,
        isbn: incomingIsbn,
        type: normalizedType,
        categoryId: data.categoryId,
        description: data.description,
        image: coverImageUrl,
        stock: 0
      };

      // 4. Insert ke Database + sync stock ke items
      const newCollection = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(collections)
          .values(collectionData)
          .returning();

        if (!inserted) {
          throw new Error("Failed to insert collection");
        }

        await this.syncItemsWithStock(
          tx,
          inserted.id,
          Math.max(0, targetStock)
        );

        const refreshed = await tx.query.collections.findFirst({
          where: eq(collections.id, inserted.id)
        });

        if (!refreshed) {
          throw new Error("Failed to load inserted collection");
        }

        return refreshed;
      });

      if (!newCollection) {
        return {
          success: false,
          message: "Failed to insert collection",
          data: null
        };
      }

      return {
        success: true,
        message: "Collection created successfully",
        data: {
          ...newCollection,
          coverImageUrl // Sertakan URL di response agar frontend bisa lihat
        }
      };
    } catch (err) {
      console.error("[CollectionService] Error creating collection:", err);
      return {
        success: false,
        message: "Failed to create collection. Please try again.",
        data: null
      };
    }
  }

  async updateCollection(
    id: string,
    data: CollectionData,
    file?: Express.Multer.File
  ) {
    try {
      const collection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), isNull(collections.deletedAt))
      });

      if (!collection) {
        return {
          success: false,
          message: "Collection not found",
          data: null
        };
      }

      const hasIsbnInPayload = Object.prototype.hasOwnProperty.call(
        data,
        "isbn"
      );
      const nextIsbn = hasIsbnInPayload
        ? data.isbn?.trim() || null
        : collection.isbn;

      if (hasIsbnInPayload && nextIsbn) {
        const existingBook = await db.query.collections.findFirst({
          where: and(
            eq(collections.isbn, nextIsbn),
            ne(collections.id, id),
            isNull(collections.deletedAt)
          )
        });

        if (existingBook) {
          return {
            success: false,
            message: "A book with this ISBN already exists",
            data: null
          };
        }
      }

      // Handle Image Upload if file provided
      let coverImageUrl = collection.image; // Keep existing image by default
      if (file) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          "library/covers"
        );
        coverImageUrl = uploadResult.url;
      }

      const { stock: _ignoredStock, ...restData } = data;

      const updateData = {
        ...restData,
        isbn: nextIsbn,
        image: coverImageUrl,
        updatedAt: new Date()
      };

      const updatedCollection = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(collections)
          .set(updateData)
          .where(eq(collections.id, id))
          .returning();

        if (!updated) {
          throw new Error("Failed to update collection");
        }

        const nextType = updated.type;
        const requestedStock =
          typeof data.stock === "number" ? data.stock : collection.stock;
        const targetStock = nextType === "physical_book" ? requestedStock : 0;

        await this.syncItemsWithStock(tx, id, Math.max(0, targetStock));

        const refreshed = await tx.query.collections.findFirst({
          where: eq(collections.id, id)
        });

        if (!refreshed) {
          throw new Error("Failed to load updated collection");
        }

        return refreshed;
      });

      if (!updatedCollection) {
        return {
          success: false,
          message: "Failed to update collection",
          data: null
        };
      }

      return {
        success: true,
        message: "Collection updated successfully",
        data: updatedCollection
      };
    } catch (err) {
      console.error("[CollectionService] Error updating collection:", err);
      return {
        success: false,
        message: "Failed to update collection",
        data: null
      };
    }
  }

  async deleteCollection(id: string) {
    try {
      const collection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), isNull(collections.deletedAt))
      });

      if (!collection) {
        return {
          success: false,
          message: "Collection not found",
          data: null
        };
      }

      const deletedCollection = await db
        .update(collections)
        .set({ deletedAt: new Date() })
        .where(eq(collections.id, id))
        .returning();

      if (!deletedCollection) {
        return {
          success: false,
          message: "Failed to delete collection",
          data: null
        };
      }

      return {
        success: true,
        message: "Collection deleted successfully",
        data: deletedCollection
      };
    } catch (err) {
      console.error("[Collection Service] Error deleting collections ", err);
      return {
        success: false,
        message: "Failed to delete collection",
        data: null
      };
    }
  }

  async getCollectionById(id: string) {
    try {
      // Validate ID
      if (!id) {
        return {
          success: false,
          message: "Invalid collection ID",
          data: null
        };
      }

      // Check if collection exists
      const existingCollection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), isNull(collections.deletedAt)),
        with: {
          items: true
        }
      });

      if (!existingCollection) {
        return {
          success: false,
          message: "Collection not found",
          data: null
        };
      }

      return {
        success: true,
        message: "Collection retrieved successfully",
        data: existingCollection
      };
    } catch (err) {
      console.error("[CollectionService] Error getting collection:", err);
      return {
        success: false,
        message: "Failed to get collection",
        data: null
      };
    }
  }
}
