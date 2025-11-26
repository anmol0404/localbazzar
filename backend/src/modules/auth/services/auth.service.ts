import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env.config';
import prisma from '../../../config/database.config';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';
import { UserRole } from '@prisma/client';

export class AuthService {
  // Generate referral code
  private generateReferralCode(): string {
    return `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  // Verify password
  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }

  // Generate JWT tokens
  private generateTokens(userId: string, role: UserRole) {
    const accessToken = jwt.sign(
      { userId, role },
      config.jwt.secret as string,
      { expiresIn: config.jwt.expiresIn as any }
    );

    const refreshToken = jwt.sign(
      { userId, role },
      config.jwt.refreshSecret as string,
      { expiresIn: config.jwt.refreshExpiresIn as any }
    );

    return { accessToken, refreshToken };
  }

  // Register new user
  async register(data: RegisterDTO) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check phone if provided
    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (existingPhone) {
        throw new Error('User with this phone number already exists');
      }
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Generate referral code
    const referralCode = this.generateReferralCode();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        referralCode,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        referralCode: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role);

    return {
      user,
      ...tokens,
    };
  }

  // Login user
  async login(data: LoginDTO) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is banned
    if (user.status === 'BANNED') {
      throw new Error('Your account has been banned');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(user.passwordHash, data.password);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        userId: string;
        role: UserRole;
      };

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.status === 'BANNED') {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user.id, user.role);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Get current user
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        profileImage: true,
        role: true,
        status: true,
        referralCode: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
