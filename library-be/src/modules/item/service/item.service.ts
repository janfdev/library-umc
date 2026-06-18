import { db } from "../../../db";
import { items, collections, locations } from "../../../db/schema";
import { eq, and, like, isNull, sql } from "drizzle-orm";
import type { CreateItemData, BulkCreateItemData, UpdateItemData } from "../validation/item.validation";
import { syncCollectionAvailableStock } from "../../shared/utils/stock-sync";
import crypto from "crypto";

export class ItemService {

  async getAllItems(collectionId?: string) {
    let whereClause: any = isNull(items.deletedAt);
    if (collectionId) {
      whereClause = and(eq(items.collectionId, collectionId), isNull(items.deletedAt));
    }
    const result = await db.query.items.findMany({
      where: whereClause,
      with: { collection: true, location: true, vendor: true, collectionType: true },
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });
    return { success: true, message: "Items retrieved", data: result };
  }

  async getItemById(id: string) {
    const result = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
      with: { collection: true, location: true, vendor: true, collectionType: true },
    });
    if (!result) return { success: false, message: "Item not found", data: null };
    return { success: true, message: "Item retrieved", data: result };
  }

  async getItemByBarcode(barcode: string) {
    const result = await db.query.items.findFirst({
      where: and(eq(items.barcode, barcode), isNull(items.deletedAt)),
      with: { collection: true, location: true },
    });
    if (!result) return { success: false, message: "Item not found", data: null };
    return { success: true, message: "Item retrieved", data: result };
  }

  async resolveByQrToken(token: string) {
    const item = await db.query.items.findFirst({
      where: and(eq(items.qrToken, token), isNull(items.deletedAt), isNull(items.qrRevokedAt)),
      with: {
        collection: { with: { collectionAuthors: { with: { author: true } }, collectionSubjects: { with: { subject: true } } } },
        location: true,
      },
    });
    if (!item) return null;
    return item;
  }

  private generateQrToken(): string {
    return crypto.randomBytes(20).toString("hex");
  }

  async createItem(data: CreateItemData) {
    const existing = await db.query.items.findFirst({
      where: and(eq(items.itemCode, data.itemCode), isNull(items.deletedAt)),
    });
    if (existing) return { success: false, message: "item_code already exists" };

    const collection = await db.query.collections.findFirst({ where: eq(collections.id, data.collectionId) });
    if (!collection) return { success: false, message: "Collection not found" };

    const location = await db.query.locations.findFirst({ where: eq(locations.id, data.locationId) });
    if (!location) return { success: false, message: "Location not found" };

    const result = await db.transaction(async (tx) => {
      const insertData: any = {
        ...data,
        barcode: data.barcode || data.itemCode,
        price: data.price != null ? String(data.price) : null,
        qrToken: this.generateQrToken(),
        qrVersion: 1,
        qrGeneratedAt: new Date(),
      };
      const [newItem] = await tx.insert(items).values(insertData).returning();
      await syncCollectionAvailableStock(tx, data.collectionId);
      return newItem;
    });

    return { success: true, message: "Item created", data: result };
  }

  async bulkCreate(bibliographyId: string, data: BulkCreateItemData) {
    const collection = await db.query.collections.findFirst({ where: eq(collections.id, bibliographyId) });
    if (!collection) return { success: false, message: "Bibliography not found" };

    const createdItems: any[] = [];
    const errors: { itemCode: string; error: string }[] = [];

    await db.transaction(async (tx) => {
      for (const itemData of data.items) {
        try {
          const existing = await tx.query.items.findFirst({
            where: and(eq(items.itemCode, itemData.itemCode), isNull(items.deletedAt)),
          });
          if (existing) {
            errors.push({ itemCode: itemData.itemCode, error: "Duplicate item_code" });
            continue;
          }

          const locId = itemData.locationId || data.defaults?.locationId || 1;
          const [newItem] = await tx.insert(items).values({
            collectionId: bibliographyId,
            itemCode: itemData.itemCode,
            barcode: itemData.barcode || itemData.itemCode,
            inventoryCode: itemData.inventoryCode || null,
            callNumber: itemData.callNumber || null,
            locationId: locId,
            source: data.defaults?.source || null,
            priceCurrency: data.defaults?.priceCurrency || "IDR",
            collectionTypeId: data.defaults?.collectionTypeId || null,
            status: "available",
            qrToken: this.generateQrToken(),
            qrVersion: 1,
            qrGeneratedAt: new Date(),
          }).returning();
          createdItems.push(newItem);
        } catch (err) {
          errors.push({ itemCode: itemData.itemCode, error: err instanceof Error ? err.message : "Unknown error" });
        }
      }

      await syncCollectionAvailableStock(tx, bibliographyId);
    });

    return { success: true, message: `Created ${createdItems.length} items`, data: { created: createdItems.length, items: createdItems, errors } };
  }

  async updateItem(id: string, data: UpdateItemData) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });
    if (!existingItem) return { success: false, message: "Item not found" };

    if (data.barcode && data.barcode !== existingItem.barcode) {
      const dup = await db.query.items.findFirst({
        where: and(eq(items.barcode, data.barcode), isNull(items.deletedAt)),
      });
      if (dup) return { success: false, message: "Barcode already exists" };
    }

    const result = await db.transaction(async (tx) => {
      const updateData: any = { ...data, updatedAt: new Date() };
      if (data.price != null) updateData.price = String(data.price);
      const [updated] = await tx.update(items).set(updateData).where(eq(items.id, id)).returning();
      return updated;
    });

    return { success: true, message: "Item updated", data: result };
  }

  async updateItemStatus(id: string, status: string) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });
    if (!existingItem) return { success: false, message: "Item not found" };

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx.update(items).set({ status: status as any, updatedAt: new Date() }).where(eq(items.id, id)).returning();
      await syncCollectionAvailableStock(tx, existingItem.collectionId);
      return updated;
    });

    return { success: true, message: "Status updated", data: result };
  }

  async updateItemLocation(id: string, locationId: number) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });
    if (!existingItem) return { success: false, message: "Item not found" };

    const [updated] = await db.update(items).set({ locationId, updatedAt: new Date() }).where(eq(items.id, id)).returning();
    return { success: true, message: "Location updated", data: updated };
  }

  async deleteItem(id: string) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });
    if (!existingItem) return { success: false, message: "Item not found" };
    if (existingItem.status === "loaned") return { success: false, message: "Cannot delete loaned item" };

    await db.transaction(async (tx) => {
      await tx.update(items).set({ deletedAt: new Date(), status: "lost" }).where(eq(items.id, id));
      await syncCollectionAvailableStock(tx, existingItem.collectionId);
    });

    return { success: true, message: "Item deleted" };
  }

  async regenerateQr(id: string) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });
    if (!existingItem) return { success: false, message: "Item not found" };

    const newToken = this.generateQrToken();
    const [updated] = await db.update(items).set({
      qrToken: newToken,
      qrVersion: (existingItem.qrVersion || 0) + 1,
      qrGeneratedAt: new Date(),
      qrRevokedAt: null,
      updatedAt: new Date(),
    }).where(eq(items.id, id)).returning();

    return { success: true, message: "QR regenerated", data: updated };
  }

  async revokeQr(id: string) {
    const existingItem = await db.query.items.findFirst({
      where: and(eq(items.id, id), isNull(items.deletedAt)),
    });
    if (!existingItem) return { success: false, message: "Item not found" };

    const [updated] = await db.update(items).set({
      qrRevokedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(items.id, id)).returning();

    return { success: true, message: "QR revoked", data: updated };
  }

  async getBulkLabelData(ids: string[]) {
    const result = await db.query.items.findMany({
      where: and(isNull(items.deletedAt), sql`${items.id} = ANY(${ids})`),
      with: { collection: true, location: true },
    });
    return result;
  }
}

export const itemService = new ItemService();
