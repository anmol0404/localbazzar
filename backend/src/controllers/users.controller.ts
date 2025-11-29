import { Request, Response } from 'express';
import { UserService } from '../services/users.service';
import { updateProfileSchema, addressSchema, updateAddressSchema } from '../dtos/users.dto';
import { AuthRequest } from '../middlewares/auth.middleware';

const userService = new UserService();

export class UserController {
  // GET /api/v1/users/profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const profile = await userService.getUserProfile(userId);
      
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /api/v1/users/profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await userService.updateProfile(userId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/v1/users/addresses
  async addAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const validatedData = addressSchema.parse(req.body);
      const address = await userService.addAddress(userId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: address,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/v1/users/addresses
  async getAddresses(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const addresses = await userService.getAddresses(userId);

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /api/v1/users/addresses/:id
  async updateAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const addressId = req.params.id;
      const validatedData = updateAddressSchema.parse(req.body);
      const address = await userService.updateAddress(userId, addressId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Address updated successfully',
        data: address,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/v1/users/addresses/:id
  async deleteAddress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const addressId = req.params.id;
      await userService.deleteAddress(userId, addressId);

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/v1/users
  async getAllUsers(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const status = req.query.status as string;

      const result = await userService.getAllUsers({ page, limit, search, role, status });

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /api/v1/users/:id/status
  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      const { status } = req.body;
      const updatedUser = await userService.updateUserStatus(userId, status);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

