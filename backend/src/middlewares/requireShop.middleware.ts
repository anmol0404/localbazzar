import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database.config';
import { UserRole, ShopStatus } from '@prisma/client';

export const requireShop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only apply to shopkeepers
    if (req.user.role !== UserRole.SHOPKEEPER) {
      return next();
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: req.user.userId }
    });

    if (!shop) {
      return res.status(403).json({ 
        success: false, 
        message: 'Shop required', 
        code: 'SHOP_REQUIRED' 
      });
    }

    if (shop.status === ShopStatus.PENDING_APPROVAL) {
      return res.status(403).json({ 
        success: false, 
        message: 'Shop is pending approval', 
        code: 'SHOP_PENDING' 
      });
    }

    if (shop.status === ShopStatus.BANNED || shop.status === ShopStatus.CLOSED) {
      return res.status(403).json({ 
        success: false, 
        message: 'Shop is not active', 
        code: 'SHOP_INACTIVE' 
      });
    }

    // Attach shop to request for convenience
    (req as any).shop = shop;
    next();
  } catch (error) {
    console.error('Error in requireShop middleware:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

