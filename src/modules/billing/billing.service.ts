import {
  Injectable, Logger, NotFoundException, BadRequestException,
  ConflictException, ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AuditService } from "../../infrastructure/audit/audit.service";
import { AbacateClient } from "./abacate/abacate.client";
import { BillingEventPublisher } from "./events/billing-event-publisher";
import {
  RETRY_CONFIG, DEFAULT_TRIAL_DAYS,
} from "./constants/billing.constants";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

const SUBSCRIPTION_INCLUDE = {
  plan: true,
  invoices: {
    orderBy: { createdAt: "desc" } as const,
    take: 12,
  },
} satisfies Prisma.OrganizationSubscriptionInclude;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly abacate: AbacateClient,
    private readonly events: BillingEventPublisher,
    private readonly audit: AuditService,
  ) {
    this.frontendUrl = this.configService.get<string>("FRONTEND_URL", "http://localhost:5174");
  }

  // ─── Plans ───────────────────────────────────────────────

  async listPlans(activeOnly = true) {
    const where: Prisma.BillingPlanWhereInput = {};
    if (activeOnly) where.isActive = true;
    return this.prisma.billingPlan.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plano nao encontrado");
    return plan;
  }

  async createPlan(data: Prisma.BillingPlanCreateInput) {
    const existing = await this.prisma.billingPlan.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException("Slug ja existe");
    return this.prisma.billingPlan.create({ data });
  }

  async updatePlan(planId: string, data: Prisma.BillingPlanUpdateInput) {
    const plan = await this.prisma.billingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plano nao encontrado");
    if (data.slug && typeof data.slug === "string" && data.slug !== plan.slug) {
      const conflict = await this.prisma.billingPlan.findUnique({ where: { slug: data.slug } });
      if (conflict) throw new ConflictException("Slug ja em uso");
    }
    return this.prisma.billingPlan.update({ where: { id: planId }, data });
  }

  // ─── Subscription Lifecycle ──────────────────────────────

  async getSubscription(businessId: string) {
    let sub = await this.prisma.organizationSubscription.findUnique({
      where: { businessId },
      include: SUBSCRIPTION_INCLUDE,
    });
    if (!sub) {
      sub = await this.initializeSubscription(businessId);
    }
    return sub;
  }

  async initializeSubscription(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, plan: true },
    });
    if (!business) throw new NotFoundException("Business not found");

    const freePlan = await this.prisma.billingPlan.findFirst({
      where: { slug: "free", isActive: true },
    });

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + DEFAULT_TRIAL_DAYS);

    return this.prisma.organizationSubscription.create({
      data: {
        businessId,
        planId: freePlan?.id ?? null,
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
        nextBillingAt: trialEnd,
      },
      include: SUBSCRIPTION_INCLUDE,
    });
  }

  async createCheckout(businessId: string, dto: {
    planId?: string;
    returnUrl?: string;
    billingType?: "MONTHLY" | "YEARLY";
  }) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, slug: true },
    });
    if (!business) throw new NotFoundException("Business not found");

    let sub = await this.prisma.organizationSubscription.findUnique({
      where: { businessId },
    });

    if (!sub) {
      sub = await this.initializeSubscription(businessId);
    }

    let plan = dto.planId
      ? await this.prisma.billingPlan.findUnique({ where: { id: dto.planId } })
      : await this.prisma.billingPlan.findFirst({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          skip: 1,
        });

    if (!plan) throw new BadRequestException("Nenhum plano disponivel");

    const amount = dto.billingType === "YEARLY" && plan.yearlyPrice
      ? plan.yearlyPrice
      : plan.monthlyPrice;

    let checkout;
    try {
      checkout = await this.abacate.createCheckout({
        customerId: sub.abacateCustomerId ?? "",
        amount: Math.round(amount * 100),
        description: `Plano ${plan.name} - ${business.name}`,
        returnUrl: dto.returnUrl ?? `${this.frontendUrl}/faturamento`,
        metadata: {
          businessId,
          subscriptionId: sub.id,
          planId: plan.id,
          billingType: dto.billingType ?? "MONTHLY",
        },
      });
    } catch {
      // Fallback: create offline direct invoice
      const invoice = await this.createInvoice(sub.id, amount, "MONTHLY");
      return {
        checkoutUrl: null,
        invoice,
        plan,
        message: "Gateway indisponivel. Fatura gerada para pagamento manual.",
      };
    }

    return { checkoutUrl: checkout.url, checkout, plan };
  }

  async confirmPayment(invoiceId: string, amount: number, gatewayPaymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: true },
      });
      if (!invoice) throw new NotFoundException("Invoice not found");
      if (invoice.status === "PAID") return invoice;

      const updated = await tx.billingInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          paidAmount: amount,
        },
      });

      await tx.billingPayment.create({
        data: {
          invoiceId,
          amount,
          status: "PAID",
          gateway: "abacatepay",
          gatewayPaymentId,
          paidAt: new Date(),
        },
      });

      const sub = invoice.subscription;
      const now = new Date();
      const nextPeriodEnd = new Date(now);
      nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 30);

      await tx.organizationSubscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          lastBillingAt: now,
          nextBillingAt: nextPeriodEnd,
          currentPeriodStart: now,
          currentPeriodEnd: nextPeriodEnd,
          gracePeriodEnd: null,
          gracePeriodStart: null,
        },
      });

      await this.audit.log({
        businessId: sub.businessId,
        action: "billing.payment.confirmed",
        entity: "billing_invoice",
        entityId: invoiceId,
        metadata: { amount, gatewayPaymentId },
      });

      return updated;
    });
  }

  async cancelSubscription(businessId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.organizationSubscription.findUnique({
        where: { businessId },
      });
      if (!sub) throw new NotFoundException("Assinatura nao encontrada");

      if (sub.status === "CANCELLED") {
        throw new BadRequestException("Assinatura ja cancelada");
      }

      const updated = await tx.organizationSubscription.update({
        where: { id: sub.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason ?? null,
          autoRenewal: false,
        },
      });

      await this.audit.log({
        businessId,
        action: "billing.subscription.cancelled",
        entity: "organization_subscription",
        entityId: sub.id,
        metadata: { reason, previousStatus: sub.status },
      });

      return updated;
    });
  }

  async changePlan(businessId: string, planId: string, billingType?: "MONTHLY" | "YEARLY") {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.organizationSubscription.findUnique({
        where: { businessId },
        include: { plan: true },
      });
      if (!sub) throw new NotFoundException("Assinatura nao encontrada");

      const newPlan = await tx.billingPlan.findUnique({ where: { id: planId } });
      if (!newPlan) throw new NotFoundException("Plano nao encontrado");
      if (!newPlan.isActive) throw new BadRequestException("Plano nao esta ativo");

      const isUpgrade = newPlan.monthlyPrice > (sub.plan?.monthlyPrice ?? 0);

      const updated = await tx.organizationSubscription.update({
        where: { id: sub.id },
        data: {
          planId: newPlan.id,
          metadata: {
            ...(sub.metadata as Record<string, unknown> ?? {}),
            previousPlanId: sub.planId,
            changedAt: new Date().toISOString(),
            changeType: isUpgrade ? "UPGRADE" : "DOWNGRADE",
          },
        },
        include: { plan: true },
      });

      await this.audit.log({
        businessId,
        action: isUpgrade ? "billing.plan.upgraded" : "billing.plan.downgraded",
        entity: "organization_subscription",
        entityId: sub.id,
        metadata: {
          fromPlanId: sub.planId,
          toPlanId: planId,
          billingType,
        },
      });

      return updated;
    });
  }

  async renewSubscription(subscriptionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.organizationSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, business: true },
      });
      if (!sub) throw new NotFoundException("Assinatura nao encontrada");
      if (sub.status !== "ACTIVE" && sub.status !== "PAST_DUE") {
        throw new BadRequestException("Assinatura nao pode ser renovada");
      }
      if (!sub.autoRenewal) {
        this.logger.warn(`Subscription ${subscriptionId} has autoRenewal disabled, skipping renewal`);
        return null;
      }

      const amount = sub.plan?.monthlyPrice ?? 49.90;
      const invoice = await this.createInvoice(sub.id, amount, "MONTHLY");

      if (sub.abacateCustomerId) {
        try {
          const checkout = await this.abacate.createCheckout({
            customerId: sub.abacateCustomerId,
            amount: Math.round(amount * 100),
            description: `Renovacao ${sub.plan?.name ?? "assinatura"} - ${sub.business.name}`,
            metadata: {
              businessId: sub.businessId,
              subscriptionId: sub.id,
              invoiceId: invoice.id,
              type: "renewal",
            },
          });
          return { invoice, checkout };
        } catch (err) {
          this.logger.error(`Failed to create renewal checkout: ${err}`);
        }
      }

      return { invoice, checkout: null };
    });
  }

  async handleFailedPayment(invoiceId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.billingInvoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: true },
      });
      if (!invoice) throw new NotFoundException("Invoice not found");

      const newAttempts = invoice.attempts + 1;
      const nextAttempt = this.calculateNextRetry(newAttempts);

      await tx.billingInvoice.update({
        where: { id: invoiceId },
        data: {
          attempts: newAttempts,
          lastAttemptAt: new Date(),
          nextAttemptAt: nextAttempt,
          status: newAttempts >= RETRY_CONFIG.MAX_RETRIES ? "FAILED" : "PENDING",
        },
      });

      if (newAttempts >= RETRY_CONFIG.MAX_RETRIES) {
        const sub = invoice.subscription;
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + RETRY_CONFIG.GRACE_PERIOD_DAYS);

        await tx.organizationSubscription.update({
          where: { id: sub.id },
          data: {
            status: "PAST_DUE",
            gracePeriodStart: new Date(),
            gracePeriodEnd: graceEnd,
          },
        });

        await this.audit.log({
          businessId: sub.businessId,
          action: "billing.subscription.past_due",
          entity: "organization_subscription",
          entityId: sub.id,
          metadata: { invoiceId, attempts: newAttempts, graceEnd },
        });
      }

      return { attempts: newAttempts, nextAttempt };
    });
  }

  async expireTrials() {
    const expired = await this.prisma.organizationSubscription.findMany({
      where: {
        status: "TRIALING",
        trialEnd: { lte: new Date() },
      },
    });

    for (const sub of expired) {
      await this.prisma.organizationSubscription.update({
        where: { id: sub.id },
        data: {
          status: "PAST_DUE",
          gracePeriodStart: new Date(),
          gracePeriodEnd: new Date(Date.now() + RETRY_CONFIG.GRACE_PERIOD_DAYS * 86400000),
        },
      });

      this.logger.log(`Trial expired for subscription ${sub.id}`);

      const amount = 49.90;
      const invoice = await this.createInvoice(sub.id, amount, "MONTHLY");

      await this.audit.log({
        businessId: sub.businessId,
        action: "billing.trial.expired",
        entity: "organization_subscription",
        entityId: sub.id,
        metadata: { invoiceId: invoice.id },
      });
    }

    return { expired: expired.length };
  }

  async processOverdueInvoices() {
    const overdue = await this.prisma.billingInvoice.findMany({
      where: {
        status: "PENDING",
        dueDate: { lte: new Date() },
        attempts: { lt: RETRY_CONFIG.MAX_RETRIES },
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: new Date() } },
        ],
      },
      include: { subscription: true },
      take: 50,
    });

    const results: Array<{ invoiceId: string; status: string }> = [];

    for (const invoice of overdue) {
      try {
        await this.handleFailedPayment(invoice.id);
        results.push({ invoiceId: invoice.id, status: "retried" });
      } catch (err) {
        this.logger.error(`Failed to process overdue invoice ${invoice.id}: ${err}`);
        results.push({ invoiceId: invoice.id, status: "error" });
      }
    }

    return { processed: results.length, results };
  }

  async cancelExpiredGrace() {
    const expiredGrace = await this.prisma.organizationSubscription.findMany({
      where: {
        status: "PAST_DUE",
        gracePeriodEnd: { lte: new Date() },
      },
    });

    for (const sub of expiredGrace) {
      await this.prisma.organizationSubscription.update({
        where: { id: sub.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "grace_period_expired",
          autoRenewal: false,
        },
      });

      await this.prisma.business.update({
        where: { id: sub.businessId },
        data: { status: "SUSPENDED" },
      });

      this.logger.log(`Subscription ${sub.id} cancelled due to grace period expiry`);

      await this.audit.log({
        businessId: sub.businessId,
        action: "billing.subscription.grace_expired",
        entity: "organization_subscription",
        entityId: sub.id,
        metadata: { reason: "grace_period_expired" },
      });
    }

    return { cancelled: expiredGrace.length };
  }

  // ─── Invoices ────────────────────────────────────────────

  async getInvoices(businessId: string) {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { businessId },
    });
    if (!sub) return [];

    return this.prisma.billingInvoice.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: "desc" },
      include: { payments: true },
    });
  }

  async getInvoice(invoiceId: string, businessId?: string) {
    const where: Prisma.BillingInvoiceWhereUniqueInput = { id: invoiceId };
    const invoice = await this.prisma.billingInvoice.findUnique({
      where,
      include: { payments: true, subscription: true },
    });
    if (!invoice) throw new NotFoundException("Fatura nao encontrada");
    if (businessId && invoice.subscription.businessId !== businessId) {
      throw new ForbiddenException();
    }
    return invoice;
  }

  private async createInvoice(
    subscriptionId: string,
    amount: number,
    billingType: "MONTHLY" | "YEARLY",
  ) {
    const invoiceCount = await this.prisma.billingInvoice.count();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    return this.prisma.billingInvoice.create({
      data: {
        subscriptionId,
        invoiceNumber,
        amount,
        billingType,
        dueDate,
        status: "PENDING",
      },
    });
  }

  // ─── Webhook ─────────────────────────────────────────────

  async handleWebhook(payload: any, headers: Record<string, string>, idempotencyKey?: string | null) {
    if (idempotencyKey) {
      const existing = await this.prisma.webhookEvent.findFirst({
        where: { idempotencyKey },
      });
      if (existing) {
        this.logger.log(`Duplicate webhook event ignored: ${idempotencyKey}`);
        return { received: true, duplicated: true, eventId: existing.eventId };
      }
    }

    const eventId = payload.data?.id ?? randomUUID();

    const event = await this.prisma.webhookEvent.create({
      data: {
        eventId,
        eventType: payload.event,
        payload: payload as any,
        headers: headers as any,
        status: "PROCESSING",
        idempotencyKey: idempotencyKey ?? null,
      },
    });

    try {
      if (payload.event === "billing.paid") {
        const invoice = await this.prisma.billingInvoice.findFirst({
          where: { abacateId: payload.data.id },
        });

        if (invoice) {
          await this.confirmPayment(
            invoice.id,
            payload.data.amount / 100,
            payload.data.id,
          );
        }
      }

      if (payload.event === "billing.failed") {
        const invoice = await this.prisma.billingInvoice.findFirst({
          where: { abacateId: payload.data.id },
        });
        if (invoice) {
          await this.handleFailedPayment(invoice.id);
        }
      }

      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });

      return { received: true, eventId };
    } catch (err) {
      await this.prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
          processingError: (err as Error).message,
        },
      });
      throw err;
    }
  }

  // ─── Retry Logic ─────────────────────────────────────────

  private calculateNextRetry(attempt: number): Date | null {
    if (attempt > RETRY_CONFIG.MAX_RETRIES) return null;
    const delay = Math.min(
      RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1),
      RETRY_CONFIG.MAX_DELAY_MS,
    );
    return new Date(Date.now() + delay);
  }

  // ─── Admin ───────────────────────────────────────────────

  async adminListSubscriptions(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const where: Prisma.OrganizationSubscriptionWhereInput = {};
    if (filters?.status) where.status = filters.status as any;

    const [data, total] = await Promise.all([
      this.prisma.organizationSubscription.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, slug: true, plan: true, status: true } },
          plan: true,
          invoices: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organizationSubscription.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async adminGetStats() {
    const [total, byStatus, monthlyRevenue] = await Promise.all([
      this.prisma.organizationSubscription.count(),
      this.prisma.organizationSubscription.groupBy({
        by: ["status"],
        _count: true,
      }),
      this.prisma.billingInvoice.aggregate({
        _sum: { amount: true },
        where: {
          status: "PAID",
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s.status] = s._count;
    }

    return {
      total,
      active: statusMap["ACTIVE"] ?? 0,
      trialing: statusMap["TRIALING"] ?? 0,
      pastDue: statusMap["PAST_DUE"] ?? 0,
      cancelled: statusMap["CANCELLED"] ?? 0,
      expired: statusMap["EXPIRED"] ?? 0,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    };
  }

  async adminGetSubscriptionDetail(subscriptionId: string) {
    const sub = await this.prisma.organizationSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        business: { select: { id: true, name: true, slug: true, plan: true, status: true } },
        plan: true,
        invoices: { orderBy: { createdAt: "desc" }, include: { payments: true } },
      },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    return sub;
  }

  async adminCreatePlan(data: Prisma.BillingPlanCreateInput) {
    return this.createPlan(data);
  }

  async adminUpdatePlan(planId: string, data: Prisma.BillingPlanUpdateInput) {
    return this.updatePlan(planId, data);
  }
}
