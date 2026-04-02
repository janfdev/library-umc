import { type Request, type Response } from "express";
import { NotificationService } from "../service/notification.service";
import { sendFinesNotificationSchema, sendLoansNotificationSchema } from "../validation/notification.validation";

const notificationService = new NotificationService();

export async function sendFinesNotification(req: Request, res: Response) {
  try {
    const validation = sendFinesNotificationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Validation Error", data: validation.error.flatten() });
      return;
    }

    const { email, name, amount, bookTitle } = validation.data;
    await notificationService.sendFinesNotification(
      email,
      name,
      amount,
      bookTitle,
    );
    res.status(200).json({ message: "Fine notification sent successfully" });
  } catch (error) {
    console.error(
      "[NotificationController] Failed to send fine notification:",
      error,
    );
    res.status(500).json({ message: "Failed to send fine notification" });
  }
}

export async function sendLoansNotification(req: Request, res: Response) {
  try {
    const validation = sendLoansNotificationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Validation Error", data: validation.error.flatten() });
      return;
    }

    const { email, name, bookTitle, tanggalPengembalian } = validation.data;

    await notificationService.sendLoansNotification(
      email,
      name,
      bookTitle,
      tanggalPengembalian,
    );

    res.status(200).json({ message: "Loan notification sent successfully" });
  } catch (error) {
    console.error(
      "[NotificationController] Failed to send loan notification:",
      error,
    );
    res.status(500).json({ message: "Failed to send loan notification" });
  }
}
