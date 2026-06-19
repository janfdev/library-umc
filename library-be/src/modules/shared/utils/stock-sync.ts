import { db } from "../../../db";
import { items, bibliographies } from "../../../db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

/**
 * Sync the stock count on a bibliography to match available items.
 * Must be called inside a transaction.
 *
 * Flow:
 * 1. Count available non-deleted items for this bibliography
 * 2. UPDATE bibliographies.stock with the count
 *
 * The transaction provides row-level isolation. Under READ COMMITTED
 * (PostgreSQL default), concurrent transactions will serialize on the
 * UPDATE row lock, ensuring stock consistency.
 */
export async function syncCollectionAvailableStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  bibliographyId: string
): Promise<void> {
  // Count available items
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

  // Update stock — acquires row-level write lock on the bibliography row
  await tx
    .update(bibliographies)
    .set({ stock: Number(availableCount?.count ?? 0), updatedAt: new Date() })
    .where(eq(bibliographies.id, bibliographyId));
}
