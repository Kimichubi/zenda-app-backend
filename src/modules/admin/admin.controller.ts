import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../../common/guards/platform-admin.guard";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AuthService } from "../auth/auth.service";
import { BusinessPlan, BusinessStatus } from "@prisma/client";

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
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

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
      data: {
        businessId: business.id,
        role: "OWNER",
      },
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
      data: {
        businessId: body.businessId,
        role: (body.role as any) || "PROFESSIONAL",
      },
    });
  }

  @Post("activate-business/:id")
  async activateBusiness(@Param("id") id: string) {
    return this.prisma.business.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  @Post("suspend-business/:id")
  async suspendBusiness(@Param("id") id: string) {
    return this.prisma.business.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });
  }

  @Patch("businesses/:id")
  async updateBusiness(@Param("id") id: string, @Body() body: {
    name?: string;
    slug?: string;
    plan?: BusinessPlan;
    status?: BusinessStatus;
  }) {
    return this.prisma.business.update({
      where: { id },
      data: body,
    });
  }
}
