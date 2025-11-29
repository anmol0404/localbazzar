import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiations.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';
import { PERMISSIONS } from '../config/permissions.config';

const router = Router();
const negotiationController = new NegotiationController();

router.use(authenticate);

router.post('/', requirePermission(PERMISSIONS.NEGOTIATIONS_CREATE), (req, res) => negotiationController.startNegotiation(req, res));
router.get('/', requirePermission(PERMISSIONS.NEGOTIATIONS_READ), (req, res) => negotiationController.getNegotiations(req, res));
router.get('/:id/messages', requirePermission(PERMISSIONS.NEGOTIATIONS_READ), (req, res) => negotiationController.getMessages(req, res));
router.post('/:id/messages', requirePermission(PERMISSIONS.NEGOTIATIONS_UPDATE), (req, res) => negotiationController.sendMessage(req, res));
router.patch('/:id/status', requirePermission(PERMISSIONS.NEGOTIATIONS_UPDATE), (req, res) => negotiationController.updateStatus(req, res));

export default router;

