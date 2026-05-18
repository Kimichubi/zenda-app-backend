import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateMembershipPlanDto } from "./dto/create-plan.dto";
import { UpdateMembershipPlanDto } from "./dto/update-plan.dto";
import { BillingFrequency } from "@prisma/client";

@Injectable()
export class MembershipPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateMembershipPlanDto) {
    const { servicesIncluded, ...planData } = dto;

    const plan = await this.prisma.membershipPlan.create({
      data: {
        ...planData,
        businessId,
        billingFrequency: (planData.billingFrequency ?? "MONTHLY") as BillingFrequency,
        servicesIncluded: servicesIncluded
          ? {
              create: servicesIncluded.map((s) => ({
                serviceId: s.serviceId,
                usageLimit: s.usageLimit ?? null,
              })),
            }
          : undefined,
      },
      include: {
        servicesIncluded: { include: { service: true } },
        _count: { select: { subscriptions: true } },
      },
    });

    return plan;
  }

  async findAll(businessId: string, includeInactive = false) {
    const where: any = { businessId };
    if (!includeInactive) where.isActive = true;

    return this.prisma.membershipPlan.findMany({
      where,
      include: {
        servicesIncluded: { include: { service: true } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(businessId: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, businessId },
      include: {
        servicesIncluded: { include: { service: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { client: { select: { id: true, name: true, phone: true } } },
        },
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) throw new NotFoundException("Plano de assinatura nao encontrado");
    return plan;
  }

  async update(businessId: string, planId: string, dto: UpdateMembershipPlanDto) {
    const existing = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, businessId },
    });
    if (!existing) throw new NotFoundException("Plano de assinatura nao encontrado");

    const { servicesIncluded, ...planData } = dto;

    if (servicesIncluded !== undefined) {
      await this.prisma.serviceMembershipPlan.deleteMany({ where: { planId } });
    }

    const updateData: any = { ...planData };
    if (updateData.billingFrequency) {
      updateData.billingFrequency = updateData.billingFrequency as BillingFrequency;
    }

    return this.prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        ...updateData,
        servicesIncluded:
          servicesIncluded !== undefined
            ? {
                create: servicesIncluded.map((s) => ({
                  serviceId: s.serviceId,
                  usageLimit: s.usageLimit ?? null,
                })),
              }
            : undefined,
      },
      include: {
        servicesIncluded: { include: { service: true } },
        _count: { select: { subscriptions: true } },
      },
    });
  }

  async remove(businessId: string, planId: string) {
    const existing = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, businessId },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!existing) throw new NotFoundException("Plano de assinatura nao encontrado");
    if (existing._count.subscriptions > 0) {
      throw new ConflictException("Nao e possivel excluir um plano com assinaturas ativas");
    }

    await this.prisma.membershipPlan.delete({ where: { id: planId } });
    return { success: true };
  }

  async getReport(businessId: string) {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { businessId },
      include: {
        _count: { select: { subscriptions: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          select: { id: true, currentPeriodEnd: true, usageCount: true },
        },
      },
    });

    const totalActiveSubscriptions = plans.reduce(
      (sum, p) => sum + p.subscriptions.length,
      0,
    );
    const totalMonthlyRevenue = plans.reduce(
      (sum, p) => sum + p.monthlyPrice * p.subscriptions.length,
      0,
    );

    const payments = await this.prisma.subscriptionPayment.findMany({
      where: {
        subscription: { businessId },
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });

    const monthlyCollected = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const overdue = await this.prisma.clientSubscription.count({
      where: { businessId, status: "PAST_DUE" },
    });

    return {
      totalPlans: plans.length,
      totalActiveSubscriptions,
      totalMonthlyRevenue,
      monthlyCollected,
      overdueSubscriptions: overdue,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        activeSubscriptions: p.subscriptions.length,
        totalSubscriptions: p._count.subscriptions,
        revenue: p.monthlyPrice * p.subscriptions.length,
      })),
    };
  }
}
