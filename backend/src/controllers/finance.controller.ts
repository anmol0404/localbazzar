import { Request, Response } from 'express';
import { FinanceService } from '../services/finance.service';
import { createPayoutRequestSchema, updatePayoutStatusSchema, updatePlatformSettingsSchema } from '../dtos/finance.dto';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PayoutStatus } from '@prisma/client';

const financeService = new FinanceService();

export class FinanceController {
  // ==================== PAYOUTS ====================

  async createPayoutRequest(req: AuthRequest, res: Response) {
    try {
      const shopId = req.query.shopId as string; // Or from user context if shopkeeper
      if (!shopId) return res.status(400).json({ success: false, message: 'Shop ID required' });

      const validatedData = createPayoutRequestSchema.parse(req.body);
      const request = await financeService.createPayoutRequest(shopId, validatedData);
      res.status(201).json({ success: true, data: request });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPayoutRequests(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = req.query.status as PayoutStatus;
      const shopId = req.query.shopId as string;

      const result = await financeService.getPayoutRequests({ page, limit, status, shopId });
      res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updatePayoutStatus(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user!.userId;
      const validatedData = updatePayoutStatusSchema.parse(req.body);
      const request = await financeService.updatePayoutStatus(req.params.id, adminId, validatedData);
      res.status(200).json({ success: true, data: request });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getShopPayouts(req: Request, res: Response) {
    try {
      const requests = await financeService.getShopPayouts(req.params.shopId);
      res.status(200).json({ success: true, data: requests });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== SETTINGS ====================

  async updatePlatformSettings(req: Request, res: Response) {
    try {
      const validatedData = updatePlatformSettingsSchema.parse(req.body);
      const setting = await financeService.updatePlatformSettings(validatedData);
      res.status(200).json({ success: true, data: setting });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPlatformSettings(req: Request, res: Response) {
    try {
      const settings = await financeService.getPlatformSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

