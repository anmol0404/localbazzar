import { Request, Response } from 'express';
import { NotificationService } from '../services/notifications.service';
import { createReportSchema, updateReportStatusSchema, markNotificationReadSchema } from '../dtos/notifications.dto';
import { AuthRequest, authorize } from '../../auth/middlewares/auth.middleware';
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

  // Reports
  async createReport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createReportSchema.parse(req.body);
      const report = await notificationService.createReport(userId, validatedData);
      res.status(201).json({ success: true, message: 'Report submitted', data: report });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getReports(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const reports = await notificationService.getReports(userId, role);
      res.status(200).json({ success: true, data: reports });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateReportStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const reportId = req.params.id;
      const validatedData = updateReportStatusSchema.parse(req.body);
      const report = await notificationService.updateReportStatus(userId, reportId, validatedData);
      res.status(200).json({ success: true, message: 'Report updated', data: report });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
