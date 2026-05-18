import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateClientSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateClientSubscriptionDto } from "./dto/update-subscription.dto";
import { RecordUsageDto } from "./dto/record-usage.dto";
import { BillingFrequency, SubscriptionStatus } from "@prisma/client";

@Injectable()
export class ClientSubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateClientSubscriptionDto) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: dto.planId, businessId, isActive: true },
    });
    if (!plan) throw new NotFoundException("Plano nao encontrado ou inativo");

    if (plan.maxActiveSubscriptions) {
      const activeCount = await this.prisma.clientSubscription.count({
        where: { planId: dto.planId, status: "ACTIVE" },
      });
      if (activeCount >= plan.maxActiveSubscriptions) {
        throw new BadRequestException("Limite de assinaturas ativas para este plano foi atingido");
      }
    }

    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, businessId },
    });
    if (!client) throw new NotFoundException("Cliente nao encontrado");

    const existing = await this.prisma.clientSubscription.findFirst({
      where: {
        clientId: dto.clientId,
        planId: dto.planId,
        status: { in: ["ACTIVE", "TRIALING", "PAUSED"] },
      },
    });
    if (existing) {
      throw new BadRequestException("Cliente ja possui uma assinatura ativa para este plano");
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, plan.billingFrequency);

    return this.prisma.clientSubscription.create({
      data: {
        planId: dto.planId,
        clientId: dto.clientId,
        businessId,
        status: plan.trialDays > 0 ? "TRIALING" : "ACTIVE",
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingAt: periodEnd,
        autoRenewal: dto.autoRenewal ?? plan.autoRenewal,
        usageLimit: plan.usageLimitsPerPeriod,
        usageCount: 0,
        trialEndsAt: plan.trialDays > 0 ? new Date(now.getTime() + plan.trialDays * 86400000) : null,
      },
      include: {
        plan: true,
        client: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }

  async findAll(businessId: string, filters?: {
    status?: string;
    planId?: string;
    clientId?: string;
    overdue?: boolean;
  }) {
    const where: any = { businessId };
    if (filters?.status) where.status = filters.status;
    if (filters?.planId) where.planId = filters.planId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.overdue) {
      where.status = "PAST_DUE";
    }

    return this.prisma.clientSubscription.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, monthlyPrice: true } },
        client: { select: { id: true, name: true, phone: true, email: true } },
        _count: { select: { usageHistory: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(businessId: string, subscriptionId: string) {
    const sub = await this.prisma.clientSubscription.findFirst({
      where: { id: subscriptionId, businessId },
      include: {
        plan: { include: { servicesIncluded: { include: { service: true } } } },
        client: { select: { id: true, name: true, phone: true, email: true } },
        payments: { orderBy: { createdAt: "desc" } },
        usageHistory: {
          orderBy: { usedAt: "desc" },
          take: 50,
          include: { service: { select: { name: true } } },
        },
      },
    });
    if (!sub) throw new NotFoundException("Assinatura nao encontrada");
    return sub;
  }

  async update(
    businessId: string,
    subscriptionId: string,
    dto: UpdateClientSubscriptionDto,
  ) {
    const existing = await this.prisma.clientSubscription.findFirst({
      where: { id: subscriptionId, businessId },
    });
    if (!existing) throw new NotFoundException("Assinatura nao encontrada");

    const updateData: any = {};

    if (dto.status) {
      if (dto.status === "CANCELLED") {
        updateData.status = "CANCELLED" as SubscriptionStatus;
        updateData.cancelledAt = new Date();
        updateData.cancelReason = dto.cancelReason;
      } else if (dto.status === "PAUSED") {
        updateData.status = "PAUSED" as SubscriptionStatus;
        updateData.pauseUntil = dto.pauseUntil ? new Date(dto.pauseUntil) : null;
      } else if (dto.status === "ACTIVE") {
        updateData.status = "ACTIVE" as SubscriptionStatus;
        updateData.pauseUntil = null;
      } else {
        updateData.status = dto.status as SubscriptionStatus;
      }
    }

    if (dto.autoRenewal !== undefined) {
      updateData.autoRenewal = dto.autoRenewal;
    }

    return this.prisma.clientSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        plan: { select: { id: true, name: true, monthlyPrice: true } },
        client: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
  }

  async recordUsage(
    businessId: string,
    subscriptionId: string,
    dto: RecordUsageDto,
  ) {
    const sub = await this.prisma.clientSubscription.findFirst({
      where: { id: subscriptionId, businessId, status: "ACTIVE" },
    });
    if (!sub) throw new NotFoundException("Assinatura ativa nao encontrada");

    if (sub.usageLimit && sub.usageCount >= sub.usageLimit) {
      throw new BadRequestException("Limite de uso do periodo foi atingido");
    }

    const usage = await this.prisma.membershipUsage.create({
      data: {
        subscriptionId,
        serviceId: dto.serviceId,
        appointmentId: dto.appointmentId,
        description: dto.description,
      },
    });

    await this.prisma.clientSubscription.update({
      where: { id: subscriptionId },
      data: { usageCount: { increment: 1 } },
    });

    return usage;
  }

  async getActiveDashboard(businessId: string) {
    const now = new Date();

    const [active, trialing, pastDue, cancelled, expired] = await Promise.all([
      this.prisma.clientSubscription.count({
        where: { businessId, status: "ACTIVE" },
      }),
      this.prisma.clientSubscription.count({
        where: { businessId, status: "TRIALING" },
      }),
      this.prisma.clientSubscription.count({
        where: { businessId, status: "PAST_DUE" },
      }),
      this.prisma.clientSubscription.count({
        where: { businessId, status: "CANCELLED" },
      }),
      this.prisma.clientSubscription.count({
        where: { businessId, status: "EXPIRED" },
      }),
    ]);

    const recentSubscriptions = await this.prisma.clientSubscription.findMany({
      where: { businessId },
      include: {
        plan: { select: { id: true, name: true, monthlyPrice: true } },
        client: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const renewalsThisMonth = await this.prisma.clientSubscription.count({
      where: {
        businessId,
        nextBillingAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      },
    });

    const monthlyRevenue = await this.prisma.subscriptionPayment.aggregate({
      where: {
        subscription: { businessId },
        status: "PAID",
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _sum: { amount: true },
    });

    return {
      active,
      trialing,
      pastDue,
      cancelled,
      expired,
      renewalsThisMonth,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      total: active + trialing + pastDue,
      recentSubscriptions,
    };
  }

  private calculatePeriodEnd(from: Date, frequency: string): Date {
    const date = new Date(from);
    switch (frequency) {
      case "WEEKLY": date.setDate(date.getDate() + 7); break;
      case "BIWEEKLY": date.setDate(date.getDate() + 14); break;
      case "MONTHLY": date.setMonth(date.getMonth() + 1); break;
      case "BIMONTHLY": date.setMonth(date.getMonth() + 2); break;
      case "QUARTERLY": date.setMonth(date.getMonth() + 3); break;
      case "SEMESTERLY": date.setMonth(date.getMonth() + 6); break;
      case "YEARLY": date.setFullYear(date.getFullYear() + 1); break;
      default: date.setMonth(date.getMonth() + 1);
    }
    return date;
  }
}
