import { db } from "../../../db";
import { logs, Users } from "../../../db/schema";
import { eq, desc, type SQL, and } from "drizzle-orm";

interface CreateLogPayload {
  userId?: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "approve"
    | "blacklist"
    | "failed_login"
    | "rate_limited";
  entity:
    | "loan"
    | "item"
    | "fine"
    | "Users"
    | "category"
    | "collection"
    | "reservation"
    | "auth";
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  detail?: string;
}

class AuditService {
  /**
   * Log an action to the database.
   * Does NOT throw errors to prevent main flows from failing just because logging failed.
   */
  async createLog(payload: CreateLogPayload): Promise<void> {
    try {
      await db.insert(logs).values({
        userId: payload.userId || null,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId || null,
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null,
        detail: payload.detail || null,
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
      const conditions: SQL<unknown>[] = [];
      if (filters.action) {
        conditions.push(
          eq(
            logs.action,
            filters.action as
              | "create"
              | "update"
              | "delete"
              | "approve"
              | "blacklist"
              | "failed_login"
              | "rate_limited",
          ),
        );
      }
      if (filters.entity) {
        conditions.push(
          eq(
            logs.entity,
            filters.entity as
              | "loan"
              | "item"
              | "fine"
              | "Users"
              | "category"
              | "collection"
              | "reservation"
              | "auth",
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select({
          id: logs.id,
          userId: logs.userId,
          action: logs.action,
          entity: logs.entity,
          entityId: logs.entityId,
          ipAddress: logs.ipAddress,
          userAgent: logs.userAgent,
          detail: logs.detail,
          createdAt: logs.createdAt,
          user: {
            id: Users.id,
            name: Users.name,
            email: Users.email,
            role: Users.role,
          },
        })
        .from(logs)
        .leftJoin(Users, eq(Users.id, logs.userId))
        .where(whereClause)
        .orderBy(desc(logs.createdAt))
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

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
