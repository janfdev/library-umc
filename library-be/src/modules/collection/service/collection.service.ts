import { db } from "../../../db";
import { collections, categories, items, locations } from "../../../db/schema";
import { uploadToCloudinary } from "../../../utils/upload";
import { eq, or, ilike, and, isNull, sql } from "drizzle-orm";

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

export class CollectionService {
  private async syncCollectionAvailableStock(tx: any, collectionId: string) {
    const [availableCount] = await tx
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(
        and(
          eq(items.collectionId, collectionId),
          eq(items.status, "available"),
          isNull(items.deletedAt),
        ),
      );

    await tx
      .update(collections)
      .set({ stock: Number(availableCount?.count ?? 0), updatedAt: new Date() })
      .where(eq(collections.id, collectionId));
  }

  private generateAutoCode(
    prefix: string,
    collectionId: string,
    index: number,
  ) {
    const shortId = collectionId.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `${prefix}-${shortId}-${Date.now()}-${index + 1}`;
  }

  private async syncItemsWithStock(
    tx: any,
    collectionId: string,
    targetStock: number,
  ) {
    const existingItems = await tx.query.items.findMany({
      where: and(eq(items.collectionId, collectionId), isNull(items.deletedAt)),
    });

    const currentStock = existingItems.length;
    if (targetStock === currentStock) {
      await this.syncCollectionAvailableStock(tx, collectionId);
      return;
    }

    if (targetStock > currentStock) {
      const diff = targetStock - currentStock;

      const defaultLocation = await tx.query.locations.findFirst({
        where: isNull(locations.deletedAt),
      });

      if (!defaultLocation) {
        throw new Error(
          "Tidak ada lokasi aktif. Tambahkan lokasi terlebih dahulu sebelum menambah stock.",
        );
      }

      const values = Array.from({ length: diff }, (_, idx) => ({
        collectionId,
        locationId: defaultLocation.id,
        status: "available" as const,
        barcode: this.generateAutoCode("AUTO", collectionId, idx),
        uniqueCode: this.generateAutoCode("UC", collectionId, idx),
      }));

      await tx.insert(items).values(values);
    } else {
      const diff = currentStock - targetStock;
      const removableItems = existingItems
        .filter((item: any) => item.status === "available")
        .slice(0, diff);

      if (removableItems.length < diff) {
        throw new Error(
          "Stock tidak bisa dikurangi karena sebagian item sedang dipinjam atau tidak tersedia.",
        );
      }

      await Promise.all(
        removableItems.map((item: any) =>
          tx
            .update(items)
            .set({
              deletedAt: new Date(),
              status: "lost",
              updatedAt: new Date(),
            })
            .where(eq(items.id, item.id)),
        ),
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
            ilike(collections.isbn, `%${search}%`),
          ),
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
          category: true,
        },
        orderBy: (collections, { desc }) => [desc(collections.createdAt)],
        limit: 100,
      });

      return {
        success: true,
        message: "Get Collections Successfully",
        data: result,
      };
    } catch (err) {
      console.error("[CollectionService] Error getting collections:", err);
      return {
        success: false,
        message: "Failed to get collections",
        data: null,
      };
    }
  }

  // Create New Collection
  async createCollection(data: CollectionData, file?: Express.Multer.File) {
    try {
      // 1. Validate categoryId
      if (data.categoryId) {
        const category = await db.query.categories.findFirst({
          where: eq(categories.id, data.categoryId),
        });

        if (!category) {
          return {
            success: false,
            message: "Category not found. Please select a valid category.",
            data: null,
          };
        }
      }

      // 2. Check for duplicate ISBN (if provided)
      if (data.isbn && data.isbn.trim() !== "") {
        const existingBook = await db.query.collections.findFirst({
          where: and(
            eq(collections.isbn, data.isbn.trim()),
            isNull(collections.deletedAt),
          ),
        });

        if (existingBook) {
          return {
            success: false,
            message: "A book with this ISBN already exists",
            data: null,
          };
        }
      }

      // 3. Upload Cover Image ke Cloudinary (Jika ada)
      let coverImageUrl = null;

      if (file) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          "library/covers",
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
        isbn: data.isbn?.trim() || null,
        type: normalizedType,
        categoryId: data.categoryId,
        description: data.description,
        image: coverImageUrl,
        stock: 0,
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
          Math.max(0, targetStock),
        );

        const refreshed = await tx.query.collections.findFirst({
          where: eq(collections.id, inserted.id),
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
          data: null,
        };
      }

      return {
        success: true,
        message: "Collection created successfully",
        data: {
          ...newCollection,
          coverImageUrl, // Sertakan URL di response agar frontend bisa lihat
        },
      };
    } catch (err) {
      console.error("[CollectionService] Error creating collection:", err);
      return {
        success: false,
        message: "Failed to create collection. Please try again.",
        data: null,
      };
    }
  }

  async updateCollection(
    id: string,
    data: CollectionData,
    file?: Express.Multer.File,
  ) {
    try {
      const collection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), isNull(collections.deletedAt)),
      });

      if (!collection) {
        return {
          success: false,
          message: "Collection not found",
          data: null,
        };
      }

      // Handle Image Upload if file provided
      let coverImageUrl = collection.image; // Keep existing image by default
      if (file) {
        const uploadResult = await uploadToCloudinary(
          file.buffer,
          "library/covers",
        );
        coverImageUrl = uploadResult.url;
      }

      const { stock: _ignoredStock, ...restData } = data;

      const updateData = {
        ...restData,
        image: coverImageUrl,
        updatedAt: new Date(),
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
          where: eq(collections.id, id),
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
          data: null,
        };
      }

      return {
        success: true,
        message: "Collection updated successfully",
        data: updatedCollection,
      };
    } catch (err) {
      console.error("[CollectionService] Error updating collection:", err);
      return {
        success: false,
        message: "Failed to update collection",
        data: null,
      };
    }
  }

  async deleteCollection(id: string) {
    try {
      const collection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), isNull(collections.deletedAt)),
      });

      if (!collection) {
        return {
          success: false,
          message: "Collection not found",
          data: null,
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
          data: null,
        };
      }

      return {
        success: true,
        message: "Collection deleted successfully",
        data: deletedCollection,
      };
    } catch (err) {
      console.error("[Collection Service] Error deleting collections ", err);
      return {
        success: false,
        message: "Failed to delete collection",
        data: null,
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
          data: null,
        };
      }

      // Check if collection exists
      const existingCollection = await db.query.collections.findFirst({
        where: and(eq(collections.id, id), isNull(collections.deletedAt)),
        with: {
          items: true,
        },
      });

      if (!existingCollection) {
        return {
          success: false,
          message: "Collection not found",
          data: null,
        };
      }

      return {
        success: true,
        message: "Collection retrieved successfully",
        data: existingCollection,
      };
    } catch (err) {
      console.error("[CollectionService] Error getting collection:", err);
      return {
        success: false,
        message: "Failed to get collection",
        data: null,
      };
    }
  }
}
