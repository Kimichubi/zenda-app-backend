import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../../common/guards/platform-admin.guard";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AuthService } from "../auth/auth.service";
import { BusinessPlan, BusinessStatus } from "@prisma/client";
import { hashPassword } from "../../common/utils/hash.js";

@Controller("admin")
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Get("users")
  async listUsers(@Query("search") search?: string, @Query("status") status?: string) {
    const users = await this.usersRepository.findAll();

    const mapped = await Promise.all(users.map(async (u) => {
      let businessName: string | null = null;
      let businessPlan: string | null = null;
      if (u.businessId) {
        const b = await this.prisma.business.findUnique({
          where: { id: u.businessId },
          select: { name: true, plan: true },
        });
        businessName = b?.name ?? null;
        businessPlan = b?.plan ?? null;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        businessId: u.businessId,
        businessName,
        businessPlan,
        onboarding: !u.businessId,
        createdAt: u.createdAt,
      };
    }));

    let filtered = mapped;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.businessName && u.businessName.toLowerCase().includes(q))
      );
    }
    if (status === "onboarding") {
      filtered = filtered.filter(u => u.onboarding);
    } else if (status === "active") {
      filtered = filtered.filter(u => !u.onboarding);
    }

    return filtered;
  }

  @Get("users/:id/detail")
  async getUserDetail(@Param("id") id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) return null;

    let stats: any = null;
    if (user.businessId) {
      const [appointmentsCount, clientsCount, servicesCount, paymentsResult] = await Promise.all([
        this.prisma.appointment.count({ where: { businessId: user.businessId } }),
        this.prisma.client.count({ where: { businessId: user.businessId } }),
        this.prisma.service.count({ where: { businessId: user.businessId } }),
        this.prisma.payment.aggregate({
          where: { appointment: { businessId: user.businessId }, status: "PAID" },
          _sum: { amount: true },
        }),
      ]);

      stats = {
        totalAppointments: appointmentsCount,
        totalRevenue: paymentsResult._sum.amount ?? 0,
        totalClients: clientsCount,
        totalServices: servicesCount,
      };
    }

    let business: any = null;
    if (user.businessId) {
      business = await this.prisma.business.findUnique({
        where: { id: user.businessId },
        include: {
          staff: { select: { id: true, name: true, email: true, role: true, baseCommission: true } },
        },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      business,
      stats,
      createdAt: user.createdAt,
    };
  }

  @Patch("users/:id/role")
  async updateRole(@Param("id") id: string, @Body("role") role: string) {
    return this.usersRepository.update(id, { role });
  }

  @Patch("users/:id/commission")
  async updateCommission(@Param("id") id: string, @Body("baseCommission") baseCommission: number) {
    return this.usersRepository.update(id, { baseCommission });
  }

  @Delete("users/:id")
  async deleteUser(@Param("id") id: string) {
    await this.usersRepository.delete(id);
    return { success: true };
  }

  @Post("users/:id/reset-password")
  async resetPassword(@Param("id") id: string, @Body("password") password: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) return { success: false, message: "User not found" };
    const passwordHash = await hashPassword(password);
    await this.usersRepository.update(id, { passwordHash });
    return { success: true };
  }

  @Get("stats")
  async getStats() {
    const [
      totalUsers,
      onboardingUsers,
      totalBusinesses,
      activeBusinesses,
      totalAppointments,
      totalRevenue,
      totalClients,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { businessId: null } }),
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: "ACTIVE" } }),
      this.prisma.appointment.count(),
      this.prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      this.prisma.client.count(),
    ]);

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, businessId: true, role: true, createdAt: true },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await this.prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    return {
      totalUsers,
      onboardingUsers,
      activeUsers: totalUsers - onboardingUsers,
      totalBusinesses,
      activeBusinesses,
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      totalClients,
      newThisMonth,
      recentUsers,
    };
  }

  @Post("impersonate/:userId")
  async impersonate(@Param("userId") userId: string, @Request() req: any) {
    const adminUser = req.user;
    const targetUser = await this.usersRepository.findById(userId);
    if (!targetUser) return null;

    return this.authService.buildAuthResponse(
      adminUser.id,
      adminUser.email,
      adminUser.name,
      adminUser.role,
      undefined,
      false,
      targetUser.businessId ?? undefined,
    );
  }

  @Post("businesses/:id/access")
  async accessBusiness(@Param("id") id: string, @Request() req: any) {
    const adminUser = req.user;
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) return null;

    return this.authService.buildAuthResponse(
      adminUser.id,
      adminUser.email,
      adminUser.name,
      adminUser.role,
      undefined,
      false,
      business.id,
    );
  }

  @Get("monitoring")
  async getMonitoring() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalBusinesses,
      activeBusinesses,
      pendingBusinesses,
      suspendedBusinesses,
      totalUsers,
      usersWithBusiness,
      totalAppointments,
      appointmentsThisMonth,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      totalClients,
      newBusinessesThisMonth,
      recentAppointments,
      businessesByPlan,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: "ACTIVE" } }),
      this.prisma.business.count({ where: { status: "PENDING" } }),
      this.prisma.business.count({ where: { status: "SUSPENDED" } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { businessId: { not: null } } }),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
      this.prisma.client.count(),
      this.prisma.business.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.appointment.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { client: { select: { name: true } }, service: { select: { name: true } }, business: { select: { name: true } } } }),
      this.prisma.business.groupBy({ by: ["plan"], _count: { plan: true } }),
    ]);

    const planDistribution: Record<string, number> = {};
    for (const p of businessesByPlan) {
      planDistribution[p.plan] = p._count.plan;
    }

    return {
      totalBusinesses,
      activeBusinesses,
      pendingBusinesses,
      suspendedBusinesses,
      totalUsers,
      usersWithBusiness,
      totalAppointments,
      appointmentsThisMonth,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      revenueLastMonth: revenueLastMonth._sum.amount ?? 0,
      totalClients,
      newBusinessesThisMonth,
      planDistribution,
      recentActivity: recentAppointments.map(a => ({
        id: a.id,
        type: "appointment",
        description: `${a.client?.name ?? "Cliente"} agendou ${a.service?.name ?? "um servico"} em ${a.business?.name}`,
        date: a.createdAt,
      })),
    };
  }

  // --- Onboarding / Business Management ---

  @Get("onboarding")
  async listOnboardingUsers() {
    const users = await this.usersRepository.findAll();
    return users.filter(u => !u.businessId).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
    }));
  }

  @Get("businesses")
  async listBusinesses(
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("plan") plan?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    let businesses = await this.prisma.business.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { staff: true, products: true, reviews: true, appointments: true, clients: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (search) {
      const q = search.toLowerCase();
      businesses = businesses.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.staff.some(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      );
    }

    return businesses;
  }

  @Get("businesses/:id")
  async getBusiness(@Param("id") id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true, email: true, role: true, baseCommission: true } },
        services: { select: { id: true, name: true, price: true, duration: true } },
        products: { select: { id: true, name: true, price: true, stock: true } },
      },
    });
  }

  @Post("businesses")
  async createBusiness(@Body() body: {
    name: string;
    slug: string;
    ownerId: string;
    plan?: string;
    activateNow?: boolean;
  }) {
    const business = await this.prisma.business.create({
      data: {
        name: body.name,
        slug: body.slug,
        plan: (body.plan as any) || "PRO",
        status: body.activateNow ? "ACTIVE" : "PENDING",
      },
    });

    await this.prisma.user.update({
      where: { id: body.ownerId },
      data: { businessId: business.id, role: "OWNER" },
    });

    return business;
  }

  @Post("link-user")
  async linkUserToBusiness(@Body() body: {
    userId: string;
    businessId: string;
    role?: string;
  }) {
    const business = await this.prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business) throw new Error("Business not found");

    return this.prisma.user.update({
      where: { id: body.userId },
      data: { businessId: body.businessId, role: (body.role as any) || "PROFESSIONAL" },
    });
  }

  @Post("activate-business/:id")
  async activateBusiness(@Param("id") id: string) {
    return this.prisma.business.update({ where: { id }, data: { status: "ACTIVE" } });
  }

  @Post("suspend-business/:id")
  async suspendBusiness(@Param("id") id: string) {
    return this.prisma.business.update({ where: { id }, data: { status: "SUSPENDED" } });
  }

  @Patch("businesses/:id")
  async updateBusiness(@Param("id") id: string, @Body() body: {
    name?: string;
    slug?: string;
    plan?: BusinessPlan;
    status?: BusinessStatus;
  }) {
    return this.prisma.business.update({ where: { id }, data: body });
  }

  @Get("businesses/:id/appointments")
  async getBusinessAppointments(@Param("id") id: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { businessId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
        professional: { select: { name: true } },
      },
    });
    return appointments;
  }

  // --- Reviews Admin ---

  @Get("reviews")
  async listReviews(
    @Query("search") search?: string,
    @Query("businessId") businessId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          business: { select: { name: true } },
          appointment: { include: { service: { select: { name: true } } } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data: reviews, total, page: Number(page), limit: Number(limit) };
  }

  @Patch("reviews/:id/toggle-public")
  async toggleReviewPublic(@Param("id") id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) return { success: false };
    const updated = await this.prisma.review.update({
      where: { id },
      data: { isPublic: !review.isPublic },
    });
    return { success: true, isPublic: updated.isPublic };
  }

  @Post("reviews/:id/reply")
  async replyReview(@Param("id") id: string, @Body("reply") reply: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) return { success: false };
    const updated = await this.prisma.review.update({
      where: { id },
      data: { reply, replyAt: new Date() },
    });
    return { success: true, review: updated };
  }

  // --- Chat Monitoring ---

  @Get("chat-sessions")
  async listChatSessions(
    @Query("search") search?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (search) {
      where.phoneNumber = { contains: search };
    }

    const [sessions, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { lastMessageAt: "desc" },
        include: {
          _count: { select: { logs: true } },
        },
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    return { data: sessions, total, page: Number(page), limit: Number(limit) };
  }

  @Get("chat-sessions/:id/logs")
  async getChatLogs(@Param("id") id: string) {
    const logs = await this.prisma.chatLog.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
    });
    return logs;
  }

  @Get("chat-stats")
  async getChatStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalSessions, activeSessionsThisMonth, totalLogs, intents] = await Promise.all([
      this.prisma.chatSession.count(),
      this.prisma.chatSession.count({ where: { lastMessageAt: { gte: startOfMonth } } }),
      this.prisma.chatLog.count(),
      this.prisma.chatLog.groupBy({ by: ["intent"], _count: { intent: true } }),
    ]);

    const intentDistribution = intents.map(i => ({
      intent: i.intent,
      count: i._count.intent,
    }));

    return { totalSessions, activeSessionsThisMonth, totalLogs, intentDistribution };
  }

  // --- Platform Finance ---

  @Get("finance")
  async getPlatformFinance(
    @Query("year") year?: string,
    @Query("month") month?: string,
  ) {
    const now = new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const [
      revenueThisMonth,
      revenueLastMonth,
      totalRevenue,
      appointmentsThisMonth,
      newClientsThisMonth,
      newBusinessesThisMonth,
      salesThisMonth,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: new Date(targetYear, targetMonth - 2, 1),
            lte: new Date(targetYear, targetMonth - 1, 0, 23, 59, 59, 999),
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      this.prisma.appointment.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      this.prisma.client.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      this.prisma.business.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
      this.prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    const dailyRevenue = await this.prisma.payment.groupBy({
      by: ["paidAt"],
      where: { status: "PAID", paidAt: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    return {
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      revenueLastMonth: revenueLastMonth._sum.amount ?? 0,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      paymentsCountThisMonth: revenueThisMonth._count,
      appointmentsThisMonth,
      newClientsThisMonth,
      newBusinessesThisMonth,
      salesThisMonth: salesThisMonth._sum.totalAmount ?? 0,
      salesCountThisMonth: salesThisMonth._count,
      dailyRevenue: dailyRevenue.map(d => ({
        date: d.paidAt,
        amount: d._sum.amount ?? 0,
      })),
    };
  }

  // --- Membership / Subscriptions ---

  @Get("subscriptions")
  async listPlatformSubscriptions(
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;

    const [subscriptions, total] = await Promise.all([
      this.prisma.clientSubscription.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          plan: { select: { id: true, name: true, monthlyPrice: true } },
          client: { select: { id: true, name: true, phone: true } },
          business: { select: { id: true, name: true } },
        },
      }),
      this.prisma.clientSubscription.count({ where }),
    ]);

    return { data: subscriptions, total, page: Number(page), limit: Number(limit) };
  }

  @Get("subscriptions/stats")
  async getPlatformSubscriptionStats() {
    const [active, trialing, pastDue, cancelled, expired, totalRevenue] = await Promise.all([
      this.prisma.clientSubscription.count({ where: { status: "ACTIVE" } }),
      this.prisma.clientSubscription.count({ where: { status: "TRIALING" } }),
      this.prisma.clientSubscription.count({ where: { status: "PAST_DUE" } }),
      this.prisma.clientSubscription.count({ where: { status: "CANCELLED" } }),
      this.prisma.clientSubscription.count({ where: { status: "EXPIRED" } }),
      this.prisma.subscriptionPayment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    return {
      active,
      trialing,
      pastDue,
      cancelled,
      expired,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      total: active + trialing + pastDue + cancelled + expired,
    };
  }

  // --- Audit Logs ---

  @Get("audit-logs")
  async getAuditLogs(
    @Query("action") action?: string,
    @Query("entity") entity?: string,
    @Query("businessId") businessId?: string,
    @Query("userId") userId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "50",
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (businessId) where.businessId = businessId;
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  // --- Feature Flags ---

  @Get("feature-flags")
  async listFeatureFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Post("feature-flags")
  async createFeatureFlag(@Body() body: { key: string; name: string; enabled?: boolean; plan?: string }) {
    return this.prisma.featureFlag.create({ data: body as any });
  }

  @Patch("feature-flags/:id")
  async updateFeatureFlag(@Param("id") id: string, @Body() body: { name?: string; enabled?: boolean; plan?: string }) {
    return this.prisma.featureFlag.update({ where: { id }, data: body as any });
  }

  @Delete("feature-flags/:id")
  async deleteFeatureFlag(@Param("id") id: string) {
    await this.prisma.featureFlag.delete({ where: { id } });
    return { success: true };
  }

  // --- Verification Codes ---

  @Get("verification-codes")
  async listVerificationCodes(@Query("email") email?: string) {
    const where: any = {};
    if (email) where.email = { contains: email, mode: "insensitive" };

    const codes = await this.prisma.verificationCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return codes;
  }

  // --- Support Tickets ---

  @Get("support-tickets")
  async listSupportTickets(
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data: tickets, total, page: Number(page), limit: Number(limit) };
  }

  @Post("support-tickets")
  async createSupportTicket(@Body() body: {
    subject: string;
    description: string;
    businessId?: string;
    userId?: string;
    priority?: string;
  }) {
    return this.prisma.supportTicket.create({
      data: {
        subject: body.subject,
        description: body.description,
        businessId: body.businessId,
        userId: body.userId,
        priority: (body.priority as any) || "MEDIUM",
      },
    });
  }

  @Patch("support-tickets/:id")
  async updateSupportTicket(@Param("id") id: string, @Body() body: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    internalNotes?: string;
  }) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: body as any,
    });
  }
}
