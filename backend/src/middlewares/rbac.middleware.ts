import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Permission } from '../config/permissions.config';
import { ROLE_PERMISSIONS } from '../config/roles.config';

export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden: No role assigned' 
        });
      }

      const userPermissions = ROLE_PERMISSIONS[userRole];

      if (!userPermissions || !userPermissions.includes(permission)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Forbidden: Insufficient permissions',
          required: permission
        });
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
};
