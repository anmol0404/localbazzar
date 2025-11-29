import prisma from '../config/database.config';
import { AddToCartDTO, UpdateCartItemDTO, CreateOrderDTO } from '../dtos/orders.dto';
import { OrderStatus, PaymentStatus, FulfillmentType } from '@prisma/client';

export class OrderService {
  // ==================== CART ====================

  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            shopProduct: {
              include: {
                shop: { select: { id: true, name: true, slug: true } }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { shopProduct: { include: { shop: true } } } } }
      });
    }

    return cart;
  }

  async addToCart(userId: string, data: AddToCartDTO) {
    const cart = await this.getCart(userId);
    
    // Check product
    const product = await prisma.shopProduct.findUnique({
      where: { id: data.productId }
    });

    if (!product) throw new Error('Product not found');
    if (!product.isActive) throw new Error('Product is not active');
    if (product.stock < data.quantity) throw new Error('Insufficient stock');

    // Check if item exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        shopProductId: data.productId
      }
    });

    if (existingItem) {
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          price: product.price // Update price to current
        }
      });
    }

    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        shopProductId: data.productId,
        quantity: data.quantity,
        price: product.price,
        selectedAttributes: data.selectedAttributes
      }
    });
  }

  async updateCartItem(userId: string, itemId: string, data: UpdateCartItemDTO) {
    const cart = await this.getCart(userId);
    
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });

    if (!item) throw new Error('Item not found in cart');

    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: data.quantity }
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.getCart(userId);
    
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });

    if (!item) throw new Error('Item not found in cart');

    return await prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  // ==================== ORDERS ====================

  async createOrder(userId: string, data: CreateOrderDTO) {
    const cart = await this.getCart(userId);
    
    // Filter items for the specific shop
    const cartItems = cart.items.filter(item => item.shopProduct.shopId === data.shopId);
    
    if (cartItems.length === 0) {
      throw new Error('No items in cart for this shop');
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    const deliveryFee = data.fulfillmentType === FulfillmentType.HOME_DELIVERY ? 50 : 0; // Simplified logic
    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + deliveryFee + tax;

    // Get delivery address if needed
    let deliveryAddress = {};
    if (data.fulfillmentType === FulfillmentType.HOME_DELIVERY) {
      if (!data.deliveryAddressId) throw new Error('Delivery address required');
      const address = await prisma.address.findUnique({ where: { id: data.deliveryAddressId } });
      if (!address) throw new Error('Address not found');
      deliveryAddress = address;
    }

    // Create Order Transaction
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          customerId: userId,
          shopId: data.shopId,
          status: OrderStatus.PENDING,
          fulfillmentType: data.fulfillmentType,
          subtotal,
          deliveryFee,
          tax,
          totalAmount,
          deliveryAddress: deliveryAddress,
          deliveryCode: Math.floor(1000 + Math.random() * 9000).toString(), // 4 digit OTP
        }
      });

      // 2. Create Order Items
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.shopProductId,
            quantity: item.quantity,
            price: item.price,
            productName: item.shopProduct.name
          }
        });

        // 3. Update Stock
        await tx.shopProduct.update({
          where: { id: item.shopProductId },
          data: {
            stock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity }
          }
        });
      }

      // 4. Create Payment Record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: totalAmount,
          status: PaymentStatus.PENDING,
          gateway: data.paymentMethod === 'COD' ? 'CASH' : 'STRIPE',
          method: data.paymentMethod
        }
      });

      // 5. Clear Cart Items for this shop
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          shopProductId: { in: cartItems.map((i: any) => i.shopProductId) }
        }
      });

      return newOrder;
    });

    return order;
  }

  async getOrders(userId: string, role: string) {
    if (role === 'SHOPKEEPER') {
      // Find shops owned by user
      const shops = await prisma.shop.findMany({ where: { ownerId: userId } });
      const shopIds = shops.map((s: { id: string }) => s.id);
      
      return await prisma.order.findMany({
        where: { shopId: { in: shopIds } },
        include: { items: true, customer: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Customer orders
      return await prisma.order.findMany({
        where: { customerId: userId },
        include: { items: true, shop: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  async getOrder(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: true, 
        shop: { select: { name: true, address: true, contactPhone: true } },
        customer: { select: { fullName: true, phone: true } },
        payment: true
      }
    });

    if (!order) throw new Error('Order not found');

    // Check access
    // TODO: Add proper check if user is customer OR shop owner
    
    return order;
  }

  async updateOrderStatus(userId: string, orderId: string, status: OrderStatus) {
    // Verify shop ownership
    const order = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { shop: true }
    });

    if (!order) throw new Error('Order not found');
    if (order.shop.ownerId !== userId) throw new Error('Unauthorized');

    return await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
  }
}

