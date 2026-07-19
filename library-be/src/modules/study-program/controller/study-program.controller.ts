import { type NextFunction, type Request, type Response } from "express";
import { StudyProgramService } from "../service/study-program.service";
import { createStudyProgramSchema, updateStudyProgramSchema } from "../validation/study-program.validation";
import { sendSuccess, sendError, sendValidationError } from "../../../utils/api-utils";

const studyProgramService = new StudyProgramService();

export class StudyProgramController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const facultyId = req.query.facultyId ? parseInt(String(req.query.facultyId)) : undefined;
      const result = await studyProgramService.getAll(facultyId);
      if (!result.success) return sendError(res, result.message, 500);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return sendError(res, "Invalid study program ID", 400);
      const result = await studyProgramService.getById(id);
      if (!result.success) return sendError(res, result.message, 404);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createStudyProgramSchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await studyProgramService.create(validation.data, req.user?.id, String(req.ip));
      if (!result.success) return sendError(res, result.message, 409);
      sendSuccess(res, result.message, result.data, 201);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return sendError(res, "Invalid study program ID", 400);
      const validation = updateStudyProgramSchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await studyProgramService.update(id, validation.data, req.user?.id, String(req.ip));
      if (!result.success) return sendError(res, result.message, result.message === "Study program not found" ? 404 : 409);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return sendError(res, "Invalid study program ID", 400);
      const result = await studyProgramService.softDelete(id, req.user?.id, String(req.ip));
      if (!result.success) return sendError(res, result.message, result.message === "Study program not found" ? 404 : 409);
      sendSuccess(res, result.message, null);
    } catch (error) { next(error); }
  }
}
