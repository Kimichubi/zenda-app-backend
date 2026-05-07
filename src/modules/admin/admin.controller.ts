import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
  async impersonate(@Param("userId") userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) return null;

    return this.authService.buildAuthResponse(
      user.id, user.email, user.name, user.role, (user as any).businessId,
    );
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
  async listBusinesses() {
    return this.prisma.business.findMany({
      include: {
        staff: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { staff: true, products: true, reviews: true, appointments: true, clients: true } },
      },
      orderBy: { createdAt: "desc" },
    });
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
