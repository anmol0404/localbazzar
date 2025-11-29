import { Request, Response } from 'express';
import { OrderService } from '../services/orders.service';
import { 
  addToCartSchema, updateCartItemSchema, 
  createOrderSchema, updateOrderStatusSchema 
} from '../dtos/orders.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

const orderService = new OrderService();

export class OrderController {
  // ==================== CART ====================

  async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const cart = await orderService.getCart(userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addToCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = addToCartSchema.parse(req.body);
      const item = await orderService.addToCart(userId, validatedData);
      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateCartItem(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const itemId = req.params.id;
      const validatedData = updateCartItemSchema.parse(req.body);
      const item = await orderService.updateCartItem(userId, itemId, validatedData);
      res.status(200).json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async removeFromCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const itemId = req.params.id;
      await orderService.removeFromCart(userId, itemId);
      res.status(200).json({ success: true, message: 'Item removed' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==================== ORDERS ====================

  async createOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(userId, validatedData);
      res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const orders = await orderService.getOrders(userId, role);
      res.status(200).json({ success: true, data: orders });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getOrder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.id;
      const order = await orderService.getOrder(userId, orderId);
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async updateOrderStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const orderId = req.params.id;
      const validatedData = updateOrderStatusSchema.parse(req.body);
      const order = await orderService.updateOrderStatus(userId, orderId, validatedData.status);
      res.status(200).json({ success: true, message: 'Order status updated', data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

