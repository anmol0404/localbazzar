import prisma from '../config/database.config';
import { SocketService } from '../providers/socket.provider';

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


}

