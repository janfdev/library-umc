import { db } from "../../../db";
import { faculties, studyPrograms, bibliographyFaculties } from "../../../db/schema";
import { eq, isNull, and } from "drizzle-orm";
import auditService from "../../audit/service/audit.service";

type ServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export class FacultyService {
  async getAll(): Promise<ServiceResponse<any[]>> {
    try {
      const result = await db
        .select()
        .from(faculties)
        .where(isNull(faculties.deletedAt))
        .orderBy(faculties.name);
      return { success: true, message: "Faculties retrieved", data: result };
    } catch (err) {
      console.error("[FacultyService] getAll error:", err);
      return { success: false, message: "Failed to get faculties", data: null };
    }
  }

  async getById(id: number): Promise<ServiceResponse<any>> {
    try {
      const faculty = await db.query.faculties.findFirst({
        where: and(eq(faculties.id, id), isNull(faculties.deletedAt)),
      });
      if (!faculty) return { success: false, message: "Faculty not found", data: null };
      return { success: true, message: "Faculty retrieved", data: faculty };
    } catch (err) {
      console.error("[FacultyService] getById error:", err);
      return { success: false, message: "Failed to get faculty", data: null };
    }
  }

  async create(data: { name: string; code?: string }, userId?: string, ipAddress?: string): Promise<ServiceResponse<any>> {
    try {
      const existing = await db.query.faculties.findFirst({
        where: and(eq(faculties.name, data.name.trim()), isNull(faculties.deletedAt)),
      });
      if (existing) return { success: false, message: "Faculty with this name already exists", data: null };

      const [result] = await db
        .insert(faculties)
        .values({ name: data.name.trim(), code: data.code?.trim() || null })
        .returning();

      if (userId) {
        await auditService.createLog({ userId, action: "create", entity: "faculty", entityId: String(result.id), ipAddress });
      }
      return { success: true, message: "Faculty created", data: result };
    } catch (err) {
      console.error("[FacultyService] create error:", err);
      return { success: false, message: "Failed to create faculty", data: null };
    }
  }

  async update(id: number, data: { name?: string; code?: string }, userId?: string, ipAddress?: string): Promise<ServiceResponse<any>> {
    try {
      const existing = await db.query.faculties.findFirst({
        where: and(eq(faculties.id, id), isNull(faculties.deletedAt)),
      });
      if (!existing) return { success: false, message: "Faculty not found", data: null };

      if (data.name && data.name.trim() !== existing.name) {
        const duplicate = await db.query.faculties.findFirst({
          where: and(eq(faculties.name, data.name.trim()), isNull(faculties.deletedAt)),
        });
        if (duplicate && duplicate.id !== id) return { success: false, message: "Faculty with this name already exists", data: null };
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.code !== undefined) updateData.code = data.code?.trim() || null;

      const [result] = await db
        .update(faculties)
        .set(updateData)
        .where(and(eq(faculties.id, id), isNull(faculties.deletedAt)))
        .returning();

      if (userId) {
        await auditService.createLog({ userId, action: "update", entity: "faculty", entityId: String(id), ipAddress });
      }
      return { success: true, message: "Faculty updated", data: result };
    } catch (err) {
      console.error("[FacultyService] update error:", err);
      return { success: false, message: "Failed to update faculty", data: null };
    }
  }

  async softDelete(id: number, userId?: string, ipAddress?: string): Promise<ServiceResponse<any>> {
    try {
      const existing = await db.query.faculties.findFirst({
        where: and(eq(faculties.id, id), isNull(faculties.deletedAt)),
      });
      if (!existing) return { success: false, message: "Faculty not found", data: null };

      const usedByStudyProgram = await db.query.studyPrograms.findFirst({
        where: and(eq(studyPrograms.facultyId, id), isNull(studyPrograms.deletedAt)),
      });
      if (usedByStudyProgram) return { success: false, message: "Cannot delete faculty with existing study programs", data: null };

      const usedByBibliography = await db.query.bibliographyFaculties.findFirst({
        where: eq(bibliographyFaculties.facultyId, id),
      });
      if (usedByBibliography) return { success: false, message: "Cannot delete faculty used by bibliographies", data: null };

      const [deleted] = await db
        .update(faculties)
        .set({ deletedAt: new Date() })
        .where(eq(faculties.id, id))
        .returning();

      if (userId) {
        await auditService.createLog({ userId, action: "delete", entity: "faculty", entityId: String(id), ipAddress });
      }
      return { success: true, message: "Faculty deleted", data: deleted };
    } catch (err) {
      console.error("[FacultyService] delete error:", err);
      return { success: false, message: "Failed to delete faculty", data: null };
    }
  }
}
