import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiations.controller';
import { authenticate } from '../../auth/middlewares/auth.middleware';

const router = Router();
const negotiationController = new NegotiationController();

router.use(authenticate);

router.post('/', (req, res) => negotiationController.startNegotiation(req, res));
router.get('/', (req, res) => negotiationController.getNegotiations(req, res));
router.get('/:id/messages', (req, res) => negotiationController.getMessages(req, res));
router.post('/:id/messages', (req, res) => negotiationController.sendMessage(req, res));
router.patch('/:id/status', (req, res) => negotiationController.updateStatus(req, res));

export default router;
