import { Request, Response } from 'express';
import { NegotiationService } from '../services/negotiations.service';
import { createNegotiationSchema, negotiationMessageSchema, updateNegotiationStatusSchema } from '../dtos/negotiations.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

const negotiationService = new NegotiationService();

export class NegotiationController {
  // POST /api/v1/negotiations
  async startNegotiation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = createNegotiationSchema.parse(req.body);
      const negotiation = await negotiationService.startNegotiation(userId, validatedData);
      res.status(201).json({ success: true, data: negotiation });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/v1/negotiations/:id/messages
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id;
      const validatedData = negotiationMessageSchema.parse(req.body);
      const message = await negotiationService.sendMessage(userId, negotiationId, validatedData);
      res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // PATCH /api/v1/negotiations/:id/status
  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id;
      const validatedData = updateNegotiationStatusSchema.parse(req.body);
      const negotiation = await negotiationService.updateStatus(userId, negotiationId, validatedData.status);
      res.status(200).json({ success: true, message: 'Status updated', data: negotiation });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/v1/negotiations
  async getNegotiations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const negotiations = await negotiationService.getNegotiations(userId, role);
      res.status(200).json({ success: true, data: negotiations });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/v1/negotiations/:id/messages
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const negotiationId = req.params.id;
      const messages = await negotiationService.getMessages(userId, negotiationId);
      res.status(200).json({ success: true, data: messages });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

