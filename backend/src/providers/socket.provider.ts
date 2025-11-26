import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import { UserRole } from '@prisma/client';

interface AuthSocket extends Socket {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Allow all origins for now, restrict in production
        methods: ['GET', 'POST'],
      },
    });

    // Authentication Middleware
    this.io.use((socket: AuthSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: UserRole };
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthSocket) => {
      console.log(`User connected: ${socket.user?.userId}`);

      // Join user to their own room for private notifications
      if (socket.user?.userId) {
        socket.join(socket.user.userId);
      }

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user?.userId}`);
      });
    });

    console.log('Socket.io initialized');
  }

  public getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  // Helper to emit to a specific user
  public emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }

  // Helper to emit to a room (e.g., negotiation room)
  public emitToRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }
}
