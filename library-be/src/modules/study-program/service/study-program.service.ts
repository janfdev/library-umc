import { db } from "../../../db";
import { studyPrograms, faculties, bibliographyStudyPrograms } from "../../../db/schema";
import { eq, isNull, and, asc } from "drizzle-orm";
import auditService from "../../audit/service/audit.service";

type ServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export class StudyProgramService {
  async getAll(facultyId?: number): Promise<ServiceResponse<any[]>> {
    try {
      const conditions: any[] = [isNull(studyPrograms.deletedAt)];
      if (facultyId) conditions.push(eq(studyPrograms.facultyId, facultyId));

      const result = await db.query.studyPrograms.findMany({
        where: and(...conditions),
        with: { faculty: true },
        orderBy: [asc(studyPrograms.name)],
      });
      return { success: true, message: "Study programs retrieved", data: result };
    } catch (err) {
      console.error("[StudyProgramService] getAll error:", err);
      return { success: false, message: "Failed to get study programs", data: null };
    }
  }

  async getById(id: number): Promise<ServiceResponse<any>> {
    try {
      const sp = await db.query.studyPrograms.findFirst({
        where: and(eq(studyPrograms.id, id), isNull(studyPrograms.deletedAt)),
        with: { faculty: true },
      });
      if (!sp) return { success: false, message: "Study program not found", data: null };
      return { success: true, message: "Study program retrieved", data: sp };
    } catch (err) {
      console.error("[StudyProgramService] getById error:", err);
      return { success: false, message: "Failed to get study program", data: null };
    }
  }

  async create(data: { name: string; code?: string; facultyId: number }, userId?: string, ipAddress?: string): Promise<ServiceResponse<any>> {
    try {
      const existing = await db.query.studyPrograms.findFirst({
        where: and(
          eq(studyPrograms.name, data.name.trim()),
          eq(studyPrograms.facultyId, data.facultyId),
          isNull(studyPrograms.deletedAt)
        ),
      });
      if (existing) return { success: false, message: "Study program with this name already exists in this faculty", data: null };

      const facultyExists = await db.query.faculties.findFirst({
        where: and(eq(faculties.id, data.facultyId), isNull(faculties.deletedAt)),
      });
      if (!facultyExists) return { success: false, message: "Faculty not found", data: null };

      const [result] = await db
        .insert(studyPrograms)
        .values({ name: data.name.trim(), code: data.code?.trim() || null, facultyId: data.facultyId })
        .returning();

      if (userId) {
        await auditService.createLog({ userId, action: "create", entity: "study_program", entityId: String(result.id), ipAddress });
      }
      return { success: true, message: "Study program created", data: result };
    } catch (err) {
      console.error("[StudyProgramService] create error:", err);
      return { success: false, message: "Failed to create study program", data: null };
    }
  }

  async update(id: number, data: { name?: string; code?: string; facultyId?: number }, userId?: string, ipAddress?: string): Promise<ServiceResponse<any>> {
    try {
      const existing = await db.query.studyPrograms.findFirst({
        where: and(eq(studyPrograms.id, id), isNull(studyPrograms.deletedAt)),
      });
      if (!existing) return { success: false, message: "Study program not found", data: null };

      const name = data.name ?? existing.name;
      const facultyId = data.facultyId ?? existing.facultyId;

      if (data.name) {
        const duplicate = await db.query.studyPrograms.findFirst({
          where: and(
            eq(studyPrograms.name, name.trim()),
            eq(studyPrograms.facultyId, facultyId),
            isNull(studyPrograms.deletedAt)
          ),
        });
        if (duplicate && duplicate.id !== id) return { success: false, message: "Study program with this name already exists in this faculty", data: null };
      }

      if (data.facultyId) {
        const facultyExists = await db.query.faculties.findFirst({
          where: and(eq(faculties.id, data.facultyId), isNull(faculties.deletedAt)),
        });
        if (!facultyExists) return { success: false, message: "Faculty not found", data: null };
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.code !== undefined) updateData.code = data.code?.trim() || null;
      if (data.facultyId !== undefined) updateData.facultyId = data.facultyId;

      const [result] = await db
        .update(studyPrograms)
        .set(updateData)
        .where(and(eq(studyPrograms.id, id), isNull(studyPrograms.deletedAt)))
        .returning();

      if (userId) {
        await auditService.createLog({ userId, action: "update", entity: "study_program", entityId: String(id), ipAddress });
      }
      return { success: true, message: "Study program updated", data: result };
    } catch (err) {
      console.error("[StudyProgramService] update error:", err);
      return { success: false, message: "Failed to update study program", data: null };
    }
  }

  async softDelete(id: number, userId?: string, ipAddress?: string): Promise<ServiceResponse<any>> {
    try {
      const existing = await db.query.studyPrograms.findFirst({
        where: and(eq(studyPrograms.id, id), isNull(studyPrograms.deletedAt)),
      });
      if (!existing) return { success: false, message: "Study program not found", data: null };

      const usedByBibliography = await db.query.bibliographyStudyPrograms.findFirst({
        where: eq(bibliographyStudyPrograms.studyProgramId, id),
      });
      if (usedByBibliography) return { success: false, message: "Cannot delete study program used by bibliographies", data: null };

      const [deleted] = await db
        .update(studyPrograms)
        .set({ deletedAt: new Date() })
        .where(eq(studyPrograms.id, id))
        .returning();

      if (userId) {
        await auditService.createLog({ userId, action: "delete", entity: "study_program", entityId: String(id), ipAddress });
      }
      return { success: true, message: "Study program deleted", data: deleted };
    } catch (err) {
      console.error("[StudyProgramService] delete error:", err);
      return { success: false, message: "Failed to delete study program", data: null };
    }
  }
}
