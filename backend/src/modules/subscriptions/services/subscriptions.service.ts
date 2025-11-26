import prisma from '../../../config/database.config';
import { CreatePlanDTO, CreateSubscriptionDTO } from '../dtos/subscriptions.dto';
import { PaymentStatus } from '@prisma/client';

export class SubscriptionService {
  
  // ==================== PLANS ====================

  async createPlan(data: CreatePlanDTO) {
    return await prisma.plan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        durationDays: data.durationDays,
        features: data.features,
        priority: data.priority,
        isActive: true
      }
    });
  }

  async getPlans() {
    return await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
  }

  // ==================== SUBSCRIPTIONS ====================

  async createSubscription(userId: string, data: CreateSubscriptionDTO) {
    // Verify shop ownership
    const shop = await prisma.shop.findUnique({ where: { id: data.shopId } });
    if (!shop) throw new Error('Shop not found');
    if (shop.ownerId !== userId) throw new Error('Unauthorized');

    // Get Plan
    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new Error('Plan not found');

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // Create Subscription Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          shopId: data.shopId,
          planId: data.planId,
          startDate,
          endDate,
          status: 'ACTIVE', // Assume immediate activation for simplicity
          autoRenew: false
        }
      });

      // 2. Create Invoice / Package Record
      const pkg = await tx.package.create({
        data: {
          userId,
          shopId: data.shopId,
          planId: data.planId,
          amount: plan.price,
          status: PaymentStatus.COMPLETED, // Mock successful payment
          transactionId: `TXN_${Date.now()}`,
          invoiceUrl: `https://api.localbazaar.com/invoices/${Date.now()}.pdf`
        }
      });

      return { subscription, pkg };
    });

    return result;
  }

  async getShopSubscription(userId: string, shopId: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');
    if (shop.ownerId !== userId) throw new Error('Unauthorized');

    return await prisma.subscription.findFirst({
      where: { shopId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { endDate: 'desc' }
    });
  }
}
