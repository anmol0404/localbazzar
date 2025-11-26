import prisma from '../../../config/database.config';
import { SocketService } from '../../../providers/socket.provider';
import { CreateReportDTO, UpdateReportStatusDTO } from '../dtos/notifications.dto';
import { NotificationType, UserRole } from '@prisma/client';

export class NotificationService {
  private socketService = SocketService.getInstance();

  // ==================== NOTIFICATIONS ====================

  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return { notifications, unreadCount };
  }

  async markAsRead(userId: string, notificationIds: string[]) {
    await prisma.notification.updateMany({
      where: { 
        userId,
        id: { in: notificationIds }
      },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });
    return { success: true };
  }

  // Internal method to send notification
  async sendNotification(userId: string, type: NotificationType, title: string, message: string, data?: any) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {}
      }
    });

    // Emit real-time event
    this.socketService.emitToUser(userId, 'notification:new', notification);

    return notification;
  }

  // ==================== REPORTS ====================

  async createReport(reporterId: string, data: CreateReportDTO) {
    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedUserId: data.reportedUserId,
        reportedShopId: data.reportedShopId,
        reportedProductId: data.reportedProductId,
        reportedReviewId: data.reportedReviewId,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence || {}
      }
    });

    // Notify Admins (In a real app, this might go to a specific admin channel or dashboard)
    // this.socketService.emitToRoom('admin', 'report:new', report);

    return report;
  }

  async getReports(userId: string, role: string) {
    if (role !== UserRole.ADMIN) {
      // Users can only see reports they submitted
      return await prisma.report.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Admins see all reports
    return await prisma.report.findMany({
      include: {
        reporter: { select: { fullName: true, email: true } },
        reportedUser: { select: { fullName: true } },
        reportedShop: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateReportStatus(adminId: string, reportId: string, data: UpdateReportStatusDTO) {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: data.status,
        resolutionNotes: data.resolutionNotes,
        resolvedBy: adminId,
        resolvedAt: new Date()
      }
    });

    // Notify Reporter
    await this.sendNotification(
      report.reporterId,
      NotificationType.SYSTEM,
      'Report Update',
      `Your report has been updated to ${data.status}`,
      { reportId: report.id }
    );

    return report;
  }
}
