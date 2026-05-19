import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import axios from "axios";

@Injectable()
export class BillingService {
  private readonly abacateApi: string;
  private readonly abacateToken: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.abacateApi = this.configService.get<string>("ABACATE_API_URL", "https://api.abacatepay.com/v1");
    this.abacateToken = this.configService.get<string>("ABACATE_API_TOKEN", "");
  }

  async getBusinessSubscription(businessId: string) {
    let sub = await this.prisma.businessSubscription.findUnique({
      where: { businessId },
      include: {
        invoices: {
          orderBy: { dueDate: "desc" },
          take: 12,
        },
      },
    });

    if (!sub) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        select: { plan: true, name: true },
      });
      if (!business) throw new NotFoundException("Business not found");

      sub = await this.prisma.businessSubscription.create({
        data: {
          businessId,
          plan: business.plan,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        include: {
          invoices: {
            orderBy: { dueDate: "desc" },
            take: 12,
          },
        },
      });
    }

    return sub;
  }

  async generateInvoice(businessId: string) {
    const sub = await this.prisma.businessSubscription.findUnique({
      where: { businessId },
      include: { business: true },
    });

    if (!sub) throw new NotFoundException("Subscription not found");

    const amount = sub.plan === "ENTERPRISE" ? 149.90 : 49.90;

    if (this.abacateToken) {
      try {
        const response = await axios.post(
          `${this.abacateApi}/billing/create`,
          {
            amount,
            customerId: sub.abacateCustomerId,
            description: `Assinatura ${sub.plan} - ${sub.business.name}`,
          },
          {
            headers: {
              Authorization: `Bearer ${this.abacateToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        const invoice = await this.prisma.businessInvoice.create({
          data: {
            subscriptionId: sub.id,
            amount,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            status: "PENDING",
            abacateId: response.data.id,
            pixCode: response.data.pixCode,
            pixQrCode: response.data.pixQrCode,
            invoiceUrl: response.data.invoiceUrl,
            metadata: response.data,
          },
        });

        return invoice;
      } catch {
        return this.createOfflineInvoice(sub.id, amount);
      }
    }

    return this.createOfflineInvoice(sub.id, amount);
  }

  private async createOfflineInvoice(subscriptionId: string, amount: number) {
    return this.prisma.businessInvoice.create({
      data: {
        subscriptionId,
        amount,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });
  }

  async getInvoices(businessId: string) {
    const sub = await this.prisma.businessSubscription.findUnique({
      where: { businessId },
    });
    if (!sub) return [];

    return this.prisma.businessInvoice.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancelSubscription(businessId: string) {
    const sub = await this.prisma.businessSubscription.findUnique({
      where: { businessId },
    });
    if (!sub) throw new NotFoundException("Subscription not found");

    return this.prisma.businessSubscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  }

  async adminListSubscriptions() {
    return this.prisma.businessSubscription.findMany({
      include: {
        business: { select: { id: true, name: true, slug: true, plan: true, status: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminGetStats() {
    const [total, active, trialing, cancelled, pastDue] = await Promise.all([
      this.prisma.businessSubscription.count(),
      this.prisma.businessSubscription.count({ where: { status: "ACTIVE" } }),
      this.prisma.businessSubscription.count({ where: { status: "TRIALING" } }),
      this.prisma.businessSubscription.count({ where: { status: "CANCELLED" } }),
      this.prisma.businessSubscription.count({ where: { status: "PAST_DUE" } }),
    ]);

    const monthlyRevenue = await this.prisma.businessInvoice.aggregate({
      _sum: { amount: true },
      where: {
        status: "PAID",
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });

    return {
      total,
      active,
      trialing,
      cancelled,
      pastDue,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    };
  }

  // Webhook handler for AbacatePay
  async handleWebhook(payload: any) {
    if (payload.event === "billing.paid") {
      const invoice = await this.prisma.businessInvoice.findFirst({
        where: { abacateId: payload.data.id },
        include: { subscription: true },
      });

      if (invoice) {
        await this.prisma.businessInvoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });

        await this.prisma.businessSubscription.update({
          where: { id: invoice.subscriptionId },
          data: {
            status: "ACTIVE",
            lastBillingAt: new Date(),
            nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    return { received: true };
  }
}
