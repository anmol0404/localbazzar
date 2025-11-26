import { Router } from 'express';
import { ProductController } from '../controllers/products.controller';
import { authenticate, authorize } from '../../auth/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const productController = new ProductController();

// Public Routes
router.get('/categories', (req, res) => productController.getCategories(req, res));
router.get('/brands', (req, res) => productController.getBrands(req, res));
router.get('/master', (req, res) => productController.getMasterProducts(req, res));
router.get('/search', (req, res) => productController.searchProducts(req, res));
router.get('/:id', (req, res) => productController.getProduct(req, res));
router.get('/shop/:shopId', (req, res) => productController.getShopProducts(req, res));

// Protected Routes (Admin)
router.use(authenticate);
router.post('/categories', authorize(UserRole.ADMIN), (req, res) => productController.createCategory(req, res));
router.post('/brands', authorize(UserRole.ADMIN), (req, res) => productController.createBrand(req, res));
router.post('/master', authorize(UserRole.ADMIN), (req, res) => productController.createMasterProduct(req, res));

// Protected Routes (Shopkeeper)
router.post('/', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => productController.createShopProduct(req, res));
router.patch('/:id', authorize(UserRole.SHOPKEEPER, UserRole.ADMIN), (req, res) => productController.updateShopProduct(req, res));

export default router;
