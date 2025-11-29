import { Report, ReportTargetType, ReportStatus, UserRole } from '@prisma/client';
import { CreateReportDTO } from '../dtos/reports.dto';
import { AppError } from '../middlewares/error.middleware';

import prisma from '../config/database.config';

export class ReportService {
  private static instance: ReportService;

  private constructor() {}

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  async createReport(reporterId: string, data: CreateReportDTO): Promise<Report> {
    // Verify target exists based on type
    await this.verifyTargetExists(data.targetType, data.targetId);

    // Create report
    return prisma.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
        metadata: data.metadata || {},
        evidence: data.evidence || {},
        status: 'PENDING',
      },
    });
  }

  async getReports(filters: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    reporterId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.reporterId) where.reporterId = filters.reporterId;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReportById(id: string): Promise<Report | null> {
    return prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async updateReportStatus(
    id: string,
    adminId: string,
    status: ReportStatus,
    resolutionNotes?: string
  ): Promise<Report> {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new AppError(404, 'Report not found');
    }

    return prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedBy: adminId,
        resolutionNotes,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
      },
    });
  }

  private async verifyTargetExists(type: ReportTargetType, id: string) {
    let exists = false;

    switch (type) {
      case 'USER':
        exists = !!(await prisma.user.findUnique({ where: { id } }));
        break;
      case 'SHOP':
        exists = !!(await prisma.shop.findUnique({ where: { id } }));
        break;
      case 'PRODUCT':
        exists = !!(await prisma.shopProduct.findUnique({ where: { id } }));
        break;
      case 'REVIEW':
        exists = !!(await prisma.review.findUnique({ where: { id } }));
        break;
      case 'MESSAGE':
        exists = !!(await prisma.chatMessage.findUnique({ where: { id } }));
        break;
      case 'NEGOTIATION':
        exists = !!(await prisma.negotiation.findUnique({ where: { id } }));
        break;
    }

    if (!exists) {
      throw new AppError(404, `${type} not found`);
    }
  }
}

export const reportService = ReportService.getInstance();
