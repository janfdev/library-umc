import { type NextFunction, type Request, type Response } from "express";
import { NotificationService } from "../service/notification.service";
import {
  sendFinesNotificationSchema,
  sendLoansNotificationSchema,
} from "../validation/notification.validation";
import { sendValidationError } from "../../../utils/api-utils";

const notificationService = new NotificationService();

class NotificationController {
  async sendFinesNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = sendFinesNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { email, name, amount, bookTitle } = validation.data;
      await notificationService.sendFinesNotification(email, name, amount, bookTitle);

      res.status(200).json({
        success: true,
        message: "Notifikasi denda berhasil dikirim",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendLoansNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = sendLoansNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return sendValidationError(res, validation.error.flatten());
      }

      const { email, name, bookTitle, tanggalPengembalian } = validation.data;
      await notificationService.sendLoansNotification(email, name, bookTitle, tanggalPengembalian);

      res.status(200).json({
        success: true,
        message: "Notifikasi peminjaman berhasil dikirim",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}

const notificationController = new NotificationController();

// Named exports untuk backward-compat dengan route lama
export const sendFinesNotification = notificationController.sendFinesNotification.bind(notificationController);
export const sendLoansNotification = notificationController.sendLoansNotification.bind(notificationController);

export default notificationController;
