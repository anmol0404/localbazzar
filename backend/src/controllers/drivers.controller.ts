import { Request, Response } from 'express';
import { DriverService } from '../services/drivers.service';
import { 
  createDriverProfileSchema, 
  updateDriverStatusSchema, 
  updateLocationSchema, 
  verifyDeliverySchema 
} from '../dtos/drivers.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

const driverService = new DriverService();

export class DriverController {
  async createProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createDriverProfileSchema.parse(req.body);
      const driver = await driverService.createProfile(userId, validatedData);
      res.status(201).json({ success: true, data: driver });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const driver = await driverService.getProfile(userId);
      res.status(200).json({ success: true, data: driver });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = updateDriverStatusSchema.parse(req.body);
      const driver = await driverService.updateStatus(userId, validatedData);
      res.status(200).json({ success: true, data: driver });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = updateLocationSchema.parse(req.body);
      await driverService.updateLocation(userId, validatedData);
      res.status(200).json({ success: true, message: 'Location updated' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getNearbyOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const radius = req.query.radius ? Number(req.query.radius) : 5;
      const orders = await driverService.getNearbyOrders(userId, radius);
      res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async acceptOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.id;
      const order = await driverService.acceptOrder(userId, orderId);
      res.status(200).json({ success: true, message: 'Order accepted', data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyDelivery(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = verifyDeliverySchema.parse(req.body);
      const order = await driverService.verifyDelivery(userId, validatedData);
      res.status(200).json({ success: true, message: 'Delivery verified', data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

