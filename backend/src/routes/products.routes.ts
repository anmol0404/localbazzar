import { Router } from 'express';
import { ProductController } from '../controllers/products.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireShop } from '../middlewares/requireShop.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const productController = new ProductController();

// Public Routes
router.get('/categories', (req, res) => productController.getCategories(req, res));
router.get('/brands', (req, res) => productController.getBrands(req, res));
router.get('/master', (req, res) => productController.getMasterProducts(req, res));
router.get('/search', (req, res) => productController.searchProducts(req, res));
router.get('/:id', (req, res) => productController.getProduct(req, res));
router.get('/shop/:shopId', (req, res) => productController.getShopProducts(req, res));

// Protected Routes (Admin - Catalog Management)
router.use(authenticate);
router.post('/categories', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.createCategory(req, res));
router.patch('/categories/:id', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.updateCategory(req, res));
router.delete('/categories/:id', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.deleteCategory(req, res));

router.post('/brands', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.createBrand(req, res));
router.patch('/brands/:id', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.updateBrand(req, res));
router.delete('/brands/:id', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.deleteBrand(req, res));

router.post('/master', requirePermission(PERMISSIONS.CATALOG_MANAGE), (req, res) => productController.createMasterProduct(req, res));

// Protected Routes (Shopkeeper - Product Management)
router.post('/', requirePermission(PERMISSIONS.PRODUCTS_CREATE), requireShop, (req, res) => productController.createShopProduct(req, res));
router.patch('/:id', requirePermission(PERMISSIONS.PRODUCTS_UPDATE), requireShop, (req, res) => productController.updateShopProduct(req, res));
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCTS_DELETE), requireShop, (req, res) => productController.deleteShopProduct(req, res));

export default router;

