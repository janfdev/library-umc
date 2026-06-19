import { db } from "../../../db";
import { items, bibliographies } from "../../../db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

/**
 * Sync the `stock` column on `bibliographies` to match the count of
 * available (non-deleted) items for the given bibliography.
 *
 * Must be called inside a transaction — accepts the transaction object as `tx`.
 */
export async function syncCollectionAvailableStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  bibliographyId: string
): Promise<void> {
  const [availableCount] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(items)
    .where(
      and(
        eq(items.bibliographyId, bibliographyId),
        eq(items.status, "available"),
        isNull(items.deletedAt)
      )
    );

  await tx
    .update(bibliographies)
    .set({ stock: Number(availableCount?.count ?? 0), updatedAt: new Date() })
    .where(eq(bibliographies.id, bibliographyId));
}
