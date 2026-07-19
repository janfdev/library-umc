import { type NextFunction, type Request, type Response } from "express";
import { FacultyService } from "../service/faculty.service";
import { createFacultySchema, updateFacultySchema } from "../validation/faculty.validation";
import { sendSuccess, sendError, sendValidationError } from "../../../utils/api-utils";

const facultyService = new FacultyService();

export class FacultyController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await facultyService.getAll();
      if (!result.success) return sendError(res, result.message, 500);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return sendError(res, "Invalid faculty ID", 400);
      const result = await facultyService.getById(id);
      if (!result.success) return sendError(res, result.message, 404);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createFacultySchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await facultyService.create(validation.data, req.user?.id, String(req.ip));
      if (!result.success) return sendError(res, result.message, 409);
      sendSuccess(res, result.message, result.data, 201);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return sendError(res, "Invalid faculty ID", 400);
      const validation = updateFacultySchema.safeParse(req.body);
      if (!validation.success) return sendValidationError(res, validation.error.flatten());
      const result = await facultyService.update(id, validation.data, req.user?.id, String(req.ip));
      if (!result.success) return sendError(res, result.message, result.message === "Faculty not found" ? 404 : 409);
      sendSuccess(res, result.message, result.data);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) return sendError(res, "Invalid faculty ID", 400);
      const result = await facultyService.softDelete(id, req.user?.id, String(req.ip));
      if (!result.success) return sendError(res, result.message, result.message === "Faculty not found" ? 404 : 409);
      sendSuccess(res, result.message, null);
    } catch (error) { next(error); }
  }
}
