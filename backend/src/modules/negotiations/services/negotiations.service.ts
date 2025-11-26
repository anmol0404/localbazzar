import prisma from '../../../config/database.config';
import { SocketService } from '../../../providers/socket.provider';
import { CreateNegotiationDTO, NegotiationMessageDTO } from '../dtos/negotiations.dto';
import { NegotiationStatus } from '@prisma/client';

export class NegotiationService {
  private socketService = SocketService.getInstance();

  // Start a negotiation
  async startNegotiation(userId: string, data: CreateNegotiationDTO) {
    // Check if product exists and allows negotiation
    const product = await prisma.shopProduct.findUnique({
      where: { id: data.shopProductId },
      include: { shop: true }
    });

    if (!product) throw new Error('Product not found');
    if (!product.isActive) throw new Error('Product is not active');
    
    // Check if active negotiation already exists
    const existing = await prisma.negotiation.findFirst({
      where: {
        customerId: userId,
        productId: data.shopProductId,
        status: NegotiationStatus.OPEN
      }
    });

    if (existing) {
      return existing; // Return existing negotiation
    }

    // Create negotiation
    const negotiation = await prisma.negotiation.create({
      data: {
        customerId: userId,
        shopId: product.shopId,
        productId: data.shopProductId,
        status: NegotiationStatus.OPEN,
        initialPrice: data.initialPrice,
        finalPrice: data.initialPrice, // Set initial proposal as current price
      }
    });

    // Add initial message
    if (data.message) {
      await this.sendMessage(userId, negotiation.id, { 
        content: data.message, 
        price: data.initialPrice 
      }, true);
    }

    // Notify shop owner via Socket
    this.socketService.emitToUser(product.shop.ownerId, 'negotiation:new', {
      negotiationId: negotiation.id,
      productName: product.name,
      customerName: userId, // In real app, fetch user name
      price: data.initialPrice
    });

    return negotiation;
  }

  // Send a message (Customer or Shopkeeper)
  async sendMessage(senderId: string, negotiationId: string, data: NegotiationMessageDTO, isSystem: boolean = false) {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { shop: true }
    });

    if (!negotiation) throw new Error('Negotiation not found');

    // Verify participant
    if (!isSystem && negotiation.customerId !== senderId && negotiation.shop.ownerId !== senderId) {
      throw new Error('Unauthorized');
    }

    if (negotiation.status !== NegotiationStatus.OPEN) {
      throw new Error('Negotiation is closed');
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        negotiationId,
        senderId,
        message: data.content,
        offerPrice: data.price,
        isSystemMessage: isSystem
      }
    });

    // Update negotiation final price if a new price is proposed
    if (data.price) {
      await prisma.negotiation.update({
        where: { id: negotiationId },
        data: { 
          finalPrice: data.price,
          currentOffer: data.price
        }
      });
    }

    // Determine recipient
    const recipientId = senderId === negotiation.customerId ? negotiation.shop.ownerId : negotiation.customerId;

    // Emit socket event
    this.socketService.emitToUser(recipientId, 'negotiation:message', {
      negotiationId,
      message
    });

    return message;
  }

  // Accept or Reject Negotiation
  async updateStatus(userId: string, negotiationId: string, status: 'ACCEPTED' | 'REJECTED') {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { shop: true }
    });

    if (!negotiation) throw new Error('Negotiation not found');

    if (negotiation.customerId !== userId && negotiation.shop.ownerId !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.negotiation.update({
      where: { id: negotiationId },
      data: { status: status as NegotiationStatus }
    });

    // Notify other party
    const recipientId = userId === negotiation.customerId ? negotiation.shop.ownerId : negotiation.customerId;
    this.socketService.emitToUser(recipientId, 'negotiation:status', {
      negotiationId,
      status
    });

    return updated;
  }

  // Get my negotiations
  async getNegotiations(userId: string, role: string) {
    if (role === 'SHOPKEEPER') {
      // Get negotiations for shops owned by user
      const shops = await prisma.shop.findMany({ where: { ownerId: userId } });
      const shopIds = shops.map((s: { id: string }) => s.id);
      
      return await prisma.negotiation.findMany({
        where: { shopId: { in: shopIds } },
        include: { 
          product: { select: { name: true, images: true } },
          customer: { select: { fullName: true, profileImage: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 } // Last message
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else {
      // Customer negotiations
      return await prisma.negotiation.findMany({
        where: { customerId: userId },
        include: { 
          product: { select: { name: true, images: true } },
          shop: { select: { name: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      });
    }
  }

  // Get messages for a negotiation
  async getMessages(userId: string, negotiationId: string) {
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { shop: true }
    });

    if (!negotiation) throw new Error('Negotiation not found');
    if (negotiation.customerId !== userId && negotiation.shop.ownerId !== userId) {
      throw new Error('Unauthorized');
    }

    return await prisma.chatMessage.findMany({
      where: { negotiationId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
