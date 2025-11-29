import { Router } from 'express';
import { UserController } from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Profile Routes
// Profile Routes
router.get('/profile', (req, res) => userController.getProfile(req, res));
router.patch('/profile', (req, res) => userController.updateProfile(req, res));

router.get('/', (req, res) => userController.getAllUsers(req, res));
router.get('/:id', requirePermission(PERMISSIONS.USERS_READ), (req, res) => userController.getUserById(req, res));
router.patch('/:id/status', requirePermission(PERMISSIONS.USERS_APPROVE), (req, res) => userController.updateUserStatus(req, res));

// Address Routes
router.get('/addresses', (req, res) => userController.getAddresses(req, res));
router.post('/addresses', (req, res) => userController.addAddress(req, res));
router.patch('/addresses/:id', (req, res) => userController.updateAddress(req, res));
router.delete('/addresses/:id', (req, res) => userController.deleteAddress(req, res));

export default router;

