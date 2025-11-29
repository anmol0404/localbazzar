import prisma from '../config/database.config';
import { ShopStatus, OrderStatus, UserRole } from '@prisma/client';

export class AdminService {
  async getStats() {
    const [
      totalUsers,
      totalShops,
      pendingShops,
      revenueResult,
      recentUsers,
      recentShops,
      recentOrders
    ] = await Promise.all([
      // Total Users
      prisma.user.count(),
      
      // Total Shops
      prisma.shop.count(),
      
      // Pending Shops
      prisma.shop.count({
        where: { status: ShopStatus.PENDING_APPROVAL }
      }),
      
      // Total Revenue (Sum of completed orders)
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalAmount: true }
      }),
      
      // Recent Users
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      
      // Recent Shops
      prisma.shop.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        }
      }),
      
      // Recent Orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { fullName: true }
          }
        }
      })
    ]);

    // Format recent activity
    const recentActivity = [
      ...recentUsers.map(u => ({
        id: `user-${u.id}`,
        type: 'USER_REGISTER',
        message: `New user registered: ${u.fullName}`,
        time: u.createdAt,
        originalTime: u.createdAt // Keep for sorting
      })),
      ...recentShops.map(s => ({
        id: `shop-${s.id}`,
        type: 'SHOP_APPLY',
        message: `New shop application: ${s.name}`,
        time: s.createdAt,
        originalTime: s.createdAt
      })),
      ...recentOrders.map(o => ({
        id: `order-${o.id}`,
        type: 'ORDER',
        message: `New order #${o.id.slice(0, 8)} placed by ${o.customer.fullName}`,
        time: o.createdAt,
        originalTime: o.createdAt
      }))
    ]
    .sort((a, b) => b.originalTime.getTime() - a.originalTime.getTime())
    .slice(0, 10) // Take top 10 combined
    .map(activity => ({
      ...activity,
      time: this.formatTimeAgo(activity.time)
    }));

    return {
      totalUsers,
      totalShops,
      pendingShops,
      totalRevenue: Number(revenueResult._sum.totalAmount || 0),
      recentActivity
    };
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  }
}
