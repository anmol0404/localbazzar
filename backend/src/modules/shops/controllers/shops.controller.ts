import { Request, Response } from 'express';
import { ShopService } from '../services/shops.service';
import { createShopSchema, updateShopSchema, shopStatusSchema } from '../dtos/shops.dto';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';

const shopService = new ShopService();

export class ShopController {
  // POST /api/v1/shops
  async createShop(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createShopSchema.parse(req.body);
      const shop = await shopService.createShop(userId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Shop created successfully',
        data: shop,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/v1/shops/my-shops
  async getMyShops(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const shops = await shopService.getMyShops(userId);

      res.status(200).json({
        success: true,
        data: shops,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/v1/shops/nearby
  async getNearbyShops(req: Request, res: Response) {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required',
        });
      }

      const shops = await shopService.getNearbyShops(
        parseFloat(lat as string),
        parseFloat(lng as string),
        radius ? parseFloat(radius as string) : 10
      );

      res.status(200).json({
        success: true,
        data: shops,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/v1/shops/:id
  async getShop(req: Request, res: Response) {
    try {
      const shop = await shopService.getShop(req.params.id);
      res.status(200).json({
        success: true,
        data: shop,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /api/v1/shops/:id
  async updateShop(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const shopId = req.params.id;
      const validatedData = updateShopSchema.parse(req.body);
      const shop = await shopService.updateShop(userId, shopId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Shop updated successfully',
        data: shop,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /api/v1/shops/:id/status
  async updateShopStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const shopId = req.params.id;
      const validatedData = shopStatusSchema.parse(req.body);
      const shop = await shopService.updateShopStatus(userId, shopId, validatedData.status);

      res.status(200).json({
        success: true,
        message: 'Shop status updated successfully',
        data: shop,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
