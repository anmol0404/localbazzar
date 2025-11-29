import { Request, Response } from 'express';
import { config } from '../config/env.config';

export const uploadController = {
  uploadFile: (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Construct the file URL
      // Assuming the backend serves static files from the 'uploads' directory
      // We might need to configure express.static in app.ts
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: fileUrl,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'File upload failed'
      });
    }
  }
};

