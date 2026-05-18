import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    businessId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        businessId: params.businessId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async findByBusiness(businessId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findAll(filters?: {
    action?: string;
    entity?: string;
    businessId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.businessId) where.businessId = filters.businessId;
    if (filters?.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }
}
