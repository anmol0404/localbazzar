import { Request, Response } from 'express';
import { ProductService } from '../services/products.service';
import { 
  createCategorySchema, createBrandSchema, 
  createMasterProductSchema, createShopProductSchema,
  updateShopProductSchema
} from '../dtos/products.dto';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';

const productService = new ProductService();

export class ProductController {
  // Categories
  async createCategory(req: Request, res: Response) {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await productService.createCategory(validatedData);
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await productService.getCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Brands
  async createBrand(req: Request, res: Response) {
    try {
      const validatedData = createBrandSchema.parse(req.body);
      const brand = await productService.createBrand(validatedData);
      res.status(201).json({ success: true, data: brand });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getBrands(req: Request, res: Response) {
    try {
      const brands = await productService.getBrands();
      res.status(200).json({ success: true, data: brands });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Master Products
  async createMasterProduct(req: Request, res: Response) {
    try {
      const validatedData = createMasterProductSchema.parse(req.body);
      const product = await productService.createMasterProduct(validatedData);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMasterProducts(req: Request, res: Response) {
    try {
      const { query, categoryId } = req.query;
      const products = await productService.getMasterProducts(
        query as string, 
        categoryId as string
      );
      res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Shop Products
  async createShopProduct(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createShopProductSchema.parse(req.body);
      const product = await productService.createShopProduct(userId, validatedData);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getShopProducts(req: Request, res: Response) {
    try {
      const { shopId } = req.params;
      const products = await productService.getShopProducts(shopId);
      res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getProduct(req: Request, res: Response) {
    try {
      const product = await productService.getProduct(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.status(200).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateShopProduct(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const productId = req.params.id;
      const validatedData = updateShopProductSchema.parse(req.body);
      const product = await productService.updateShopProduct(userId, productId, validatedData);
      res.status(200).json({ success: true, message: 'Product updated', data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async searchProducts(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, message: 'Query required' });
      const products = await productService.searchProducts(q as string);
      res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
