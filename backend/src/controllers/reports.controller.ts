import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { reportService } from '../services/reports.service';
import { createReportSchema, updateReportStatusSchema } from '../dtos/reports.dto';
import { AppError } from '../middlewares/error.middleware';
import { ReportStatus, ReportTargetType } from '@prisma/client';

export class ReportController {
  async createReport(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const validation = createReportSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Validation Error', (validation as any).error.errors);
    }

    const report = await reportService.createReport(userId, validation.data);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully',
    });
  }

  async getReports(req: AuthRequest, res: Response) {
    const filters = {
      status: req.query.status as ReportStatus,
      targetType: req.query.targetType as ReportTargetType,
      reporterId: req.query.reporterId as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
    };

    const result = await reportService.getReports(filters);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getReportById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const report = await reportService.getReportById(id);

    if (!report) throw new AppError(404, 'Report not found');

    res.json({
      success: true,
      data: report,
    });
  }

  async updateReportStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const validation = updateReportStatusSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'Validation Error', (validation as any).error.errors);
    }

    const report = await reportService.updateReportStatus(
      id,
      userId,
      validation.data.status as ReportStatus,
      validation.data.resolutionNotes
    );

    res.json({
      success: true,
      data: report,
      message: 'Report status updated',
    });
  }
}

export const reportController = new ReportController();
