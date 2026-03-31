import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "../../../db";
import {
  Users,
  collections,
  fines,
  items,
  loans,
  members,
  transactions
} from "../../../db/schema";
import {
  BadRequestError,
  NotFoundError,
  InternalServerError
} from "../../../exceptions/AppError";

class FinesService {
  async getPaidFinesWithNonReturnedLoans(
    filters: {
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const { limit = 100, offset = 0 } = filters;

      const conditions: SQL[] = [
        isNull(fines.deletedAt),
        isNull(loans.deletedAt),
        eq(fines.status, "paid"),
        sql`${loans.status} <> 'returned'`
      ];

      const rows = await db
        .select({
          fineId: fines.id,
          fineAmount: fines.amount,
          fineStatus: fines.status,
          fineUpdatedAt: fines.updatedAt,
          loanId: loans.id,
          loanStatus: loans.status,
          dueDate: loans.dueDate,
          returnDate: loans.returnDate,
          memberId: members.id,
          memberName: Users.name,
          memberEmail: Users.email,
          collectionTitle: collections.title
        })
        .from(fines)
        .innerJoin(loans, eq(fines.loanId, loans.id))
        .leftJoin(members, eq(loans.memberId, members.id))
        .leftJoin(Users, eq(members.userId, Users.id))
        .leftJoin(items, eq(loans.itemId, items.id))
        .leftJoin(collections, eq(items.collectionId, collections.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      const [totalRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(fines)
        .innerJoin(loans, eq(fines.loanId, loans.id))
        .where(and(...conditions));

      const data = rows.map((row) => ({
        fineId: row.fineId,
        amount: Number(row.fineAmount),
        fineStatus: row.fineStatus,
        fineUpdatedAt: row.fineUpdatedAt,
        loan: {
          id: row.loanId,
          status: row.loanStatus,
          dueDate: row.dueDate,
          returnDate: row.returnDate
        },
        member: {
          id: row.memberId,
          name: row.memberName,
          email: row.memberEmail
        },
        collection: {
          title: row.collectionTitle
        }
      }));

      return {
        success: true,
        message:
          "Audit paid fines with non-returned loans fetched successfully",
        data,
        meta: {
          total: Number(totalRow?.count ?? 0),
          limit,
          offset
        }
      };
    } catch (error) {
      console.error(
        "FinesService.getPaidFinesWithNonReturnedLoans Error:",
        error
      );
      throw new InternalServerError(
        "Failed to fetch audit paid fines with non-returned loans"
      );
    }
  }

  async getAllFines(
    filters: {
      status?: "paid" | "unpaid";
      loanId?: string;
      memberId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const { status, loanId, memberId, limit = 10, offset = 0 } = filters;

      const conditions: SQL[] = [isNull(fines.deletedAt)];
      if (status) {
        conditions.push(eq(fines.status, status));
      }
      if (loanId) {
        conditions.push(eq(fines.loanId, loanId));
      }
      if (memberId) {
        conditions.push(eq(loans.memberId, memberId));
      }

      const rows = await db
        .select({
          id: fines.id,
          amount: fines.amount,
          status: fines.status,
          loanId: fines.loanId,

          dueDate: loans.dueDate,
          loanStatus: loans.status,
          returnDate: loans.returnDate,
          memberName: Users.name,
          memberEmail: Users.email,

          title: collections.title
        })
        .from(fines)
        .leftJoin(loans, eq(fines.loanId, loans.id))
        .leftJoin(members, eq(loans.memberId, members.id))
        .leftJoin(Users, eq(members.userId, Users.id))
        .leftJoin(items, eq(loans.itemId, items.id))
        .leftJoin(collections, eq(items.collectionId, collections.id))
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      const data = rows.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        status: row.status,
        loanId: row.loanId,
        loan: {
          dueDate: row.dueDate,
          status: row.loanStatus,
          returnDate: row.returnDate,
          member: {
            user: {
              name: row.memberName,
              email: row.memberEmail
            }
          },
          item: {
            collection: {
              title: row.title
            }
          }
        }
      }));

      return {
        success: true,
        message: "Fines fetched successfully",
        data
      };
    } catch (error) {
      console.error("FinesService.getAllFines Error:", error);
      throw new InternalServerError("Failed to fetch fines");
    }
  }

  async getFineById(id: string) {
    try {
      const rows = await db
        .select({
          id: fines.id,
          amount: fines.amount,
          status: fines.status,
          loanId: fines.loanId,
          createdAt: fines.createdAt,
          updatedAt: fines.updatedAt,

          dueDate: loans.dueDate,
          memberName: Users.name,
          memberEmail: Users.email,

          title: collections.title
        })
        .from(fines)
        .leftJoin(loans, eq(fines.loanId, loans.id))
        .leftJoin(members, eq(loans.memberId, members.id))
        .leftJoin(Users, eq(members.userId, Users.id))
        .leftJoin(items, eq(loans.itemId, items.id))
        .leftJoin(collections, eq(items.collectionId, collections.id))
        .where(and(eq(fines.id, id), isNull(fines.deletedAt)))
        .limit(1);

      if (!rows || rows.length === 0) {
        throw new NotFoundError("Fine not found");
      }

      const row = rows[0];

      let transactionData = null;
      if (row.status === "paid") {
        const txRows = await db
          .select({
            id: transactions.id,
            paymentMethod: transactions.paymentMethod,
            confirmedBy: transactions.confirmedBy,
            paidAt: transactions.paidAt
          })
          .from(transactions)
          .where(eq(transactions.fineId, id))
          .limit(1);

        if (txRows && txRows.length > 0) {
          transactionData = txRows[0];
        }
      }

      const data = {
        id: row.id,
        amount: Number(row.amount),
        status: row.status,
        loanId: row.loanId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        loan: {
          dueDate: row.dueDate,
          member: {
            user: {
              name: row.memberName,
              email: row.memberEmail
            }
          },
          item: {
            collection: {
              title: row.title
            }
          }
        },
        transaction: transactionData
      };

      return {
        success: true,
        message: "Fine fetched successfully",
        data
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error("FinesService.getFineById Error:", error);
      throw new InternalServerError("Failed to fetch fine with id");
    }
  }

  async createFineManual(loanId: string, amount: number) {
    try {
      if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than 0");
      }

      // 1. Cek apakah loanId valid
      const loanRow = await db
        .select({ id: loans.id })
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);
      if (!loanRow || loanRow.length === 0) {
        throw new NotFoundError("Loan not found");
      }

      // 2. Cek apakah loan sudah punya fine yang "unpaid"
      const existingFine = await db
        .select({ id: fines.id })
        .from(fines)
        .where(
          and(
            eq(fines.loanId, loanId),
            eq(fines.status, "unpaid"),
            isNull(fines.deletedAt)
          )
        )
        .limit(1);

      if (existingFine && existingFine.length > 0) {
        throw new BadRequestError(
          "An unpaid fine already exists for this loan"
        );
      }

      const row = await db
        .insert(fines)
        .values({
          loanId,
          amount: amount.toString(), // numeric field usually mapped as string
          status: "unpaid"
        })
        .returning();

      return {
        success: true,
        message: "Fine created successfully",
        data: row[0]
      };
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError)
        throw error;
      console.error("FinesService.createFineManual Error:", error);
      throw new InternalServerError("Failed to create fine manual");
    }
  }

  async payFine(
    fineId: string,
    adminId: string,
    paymentMethod: string = "cash"
  ) {
    try {
      return await db.transaction(async (tx) => {
        // Cek fine ada dan statusnya masih "unpaid"
        const existingFines = await tx
          .select({ id: fines.id, status: fines.status })
          .from(fines)
          .where(and(eq(fines.id, fineId), isNull(fines.deletedAt)))
          .limit(1);

        if (!existingFines || existingFines.length === 0) {
          throw new NotFoundError("Fine not found or has been deleted");
        }

        if (existingFines[0].status === "paid") {
          throw new BadRequestError("Fine is already paid");
        }

        // UPDATE tabel fines
        const updatedFines = await tx
          .update(fines)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(fines.id, fineId))
          .returning();

        // INSERT ke tabel transactions
        const newTransactions = await tx
          .insert(transactions)
          .values({
            fineId: fineId,
            paymentMethod: paymentMethod,
            confirmedBy: adminId,
            paidAt: new Date().toISOString().split("T")[0]
          })
          .returning();

        return {
          success: true,
          message: "Fine paid successfully",
          data: {
            fine: updatedFines[0],
            transaction: newTransactions[0]
          }
        };
      });
    } catch (error: unknown) {
      if (error instanceof BadRequestError || error instanceof NotFoundError)
        throw error;
      console.error("FinesService.payFine Error:", error);
      throw new InternalServerError("Failed to process fine payment");
    }
  }

  async deleteFine(id: string) {
    try {
      const existing = await db
        .select({ id: fines.id })
        .from(fines)
        .where(eq(fines.id, id))
        .limit(1);
      if (!existing || existing.length === 0) {
        throw new NotFoundError("Fine not found");
      }

      await db
        .update(fines)
        .set({ deletedAt: new Date() })
        .where(eq(fines.id, id));

      return {
        success: true,
        message: "Fine deleted successfully",
        data: null
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error("FinesService.deleteFine Error:", error);
      throw new InternalServerError("Failed to delete fine");
    }
  }
}

export default new FinesService();
