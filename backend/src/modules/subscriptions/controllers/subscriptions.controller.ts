import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptions.service';
import { createPlanSchema, createSubscriptionSchema } from '../dtos/subscriptions.dto';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  // Plans
  async createPlan(req: AuthRequest, res: Response) {
    try {
      const validatedData = createPlanSchema.parse(req.body);
      const plan = await subscriptionService.createPlan(validatedData);
      res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPlans(req: Request, res: Response) {
    try {
      const plans = await subscriptionService.getPlans();
      res.status(200).json({ success: true, data: plans });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Subscriptions
  async createSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createSubscriptionSchema.parse(req.body);
      const result = await subscriptionService.createSubscription(userId, validatedData);
      res.status(201).json({ success: true, message: 'Subscription activated', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getShopSubscription(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const shopId = req.params.shopId;
      const subscription = await subscriptionService.getShopSubscription(userId, shopId);
      res.status(200).json({ success: true, data: subscription });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
