import { db } from "../db";
import { logs } from "../db/schema";
import { eq, desc } from "drizzle-orm";

interface CreateLogPayload {
  userId: string;
  action: "create" | "update" | "delete" | "approve" | "blacklist";
  entity:
    | "loan"
    | "item"
    | "fine"
    | "Users"
    | "category"
    | "collection"
    | "reservation";
  entityId?: string;
  ipAddress?: string;
}

class AuditService {
  /**
   * Log an action to the database.
   * Does NOT throw errors to prevent main flows from failing just because logging failed.
   */
  async createLog(payload: CreateLogPayload): Promise<void> {
    try {
      if (!payload.userId) {
        console.error("AuditService: Missing userId, cannot write log");
        return;
      }

      await db.insert(logs).values({
        userId: payload.userId,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId || null,
        ipAddress: payload.ipAddress || null,
      });
    } catch (error) {
      console.error("AuditService Error [Ignored]:", error);
    }
  }

  /**
   * Get logs securely for admin
   */
  async getLogs(
    filters: {
      action?: string;
      entity?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    try {
      const conditions: any[] = []; // Intentionally leaving any to not break the type signature locally
      if (filters.action) {
        conditions.push(eq(logs.action, filters.action as any));
      }
      if (filters.entity) {
        conditions.push(eq(logs.entity, filters.entity as any));
      }

      // To keep query simple and robust we use query mapping
      const result = await db.query.logs.findMany({
        where:
          conditions.length > 0
            ? (t, { and }) => and(...conditions)
            : undefined,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        orderBy: [desc(logs.createdAt)],
      });

      return {
        success: true,
        message: "Berhasil memuat audit logs.",
        data: result,
      };
    } catch (error) {
      console.error("AuditService.getLogs Error:", error);
      throw error;
    }
  }
}

export default new AuditService();
