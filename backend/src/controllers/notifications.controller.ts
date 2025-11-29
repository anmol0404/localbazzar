import { Request, Response } from 'express';
import { NotificationService } from '../services/notifications.service';
import { markNotificationReadSchema } from '../dtos/notifications.dto';
import { AuthRequest, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const notificationService = new NotificationService();

export class NotificationController {
  // Notifications
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const page = req.query.page ? Number(req.query.page) : 1;
      const result = await notificationService.getNotifications(userId, page);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = markNotificationReadSchema.parse(req.body);
      await notificationService.markAsRead(userId, validatedData.notificationIds);
      res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }


}

