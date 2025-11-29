import prisma from '../config/database.config';
import { CreatePayoutRequestDTO, UpdatePayoutStatusDTO, UpdatePlatformSettingsDTO } from '../dtos/finance.dto';
import { PayoutStatus, UserRole } from '@prisma/client';

export class FinanceService {
  // ==================== PAYOUTS ====================

  async createPayoutRequest(shopId: string, data: CreatePayoutRequestDTO) {
    // Check if shop has sufficient balance (Mock check for now as Wallet is separate)
    // In real implementation, check Wallet balance
    
    return await prisma.payoutRequest.create({
      data: {
        shopId,
        amount: data.amount,
        notes: data.notes,
        status: PayoutStatus.PENDING
      }
    });
  }

  async getPayoutRequests(params: { page?: number; limit?: number; status?: PayoutStatus; shopId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.shopId) where.shopId = params.shopId;

    const [requests, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          shop: {
            select: { id: true, name: true, owner: { select: { fullName: true, email: true } } }
          }
        }
      }),
      prisma.payoutRequest.count({ where })
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updatePayoutStatus(id: string, adminId: string, data: UpdatePayoutStatusDTO) {
    const request = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!request) throw new Error('Payout request not found');

    return await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: data.status,
        transactionId: data.transactionId,
        notes: data.notes,
        processedAt: new Date(),
        processedBy: adminId
      }
    });
  }

  async getShopPayouts(shopId: string) {
    return await prisma.payoutRequest.findMany({
      where: { shopId },
      orderBy: { requestedAt: 'desc' }
    });
  }

  // ==================== SETTINGS ====================

  async updatePlatformSettings(data: UpdatePlatformSettingsDTO) {
    return await prisma.platformSettings.upsert({
      where: { key: data.key },
      update: { value: data.value },
      create: { key: data.key, value: data.value }
    });
  }

  async getPlatformSettings() {
    return await prisma.platformSettings.findMany();
  }

  async getPlatformSetting(key: string) {
    const setting = await prisma.platformSettings.findUnique({ where: { key } });
    return setting?.value || null;
  }
}

