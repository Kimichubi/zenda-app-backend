import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AuthService } from "../auth/auth.service";
import { UserPlan } from "../users/users.entity";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Get("users")
  async listUsers(@Query("search") search?: string) {
    const users = await this.usersRepository.findAll();
    const mapped = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      businessName: u.businessName,
      role: u.role,
      plan: u.plan,
      createdAt: u.createdAt
    }));

    if (search) {
      const q = search.toLowerCase();
      return mapped.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.businessName.toLowerCase().includes(q)
      );
    }

    return mapped;
  }

  @Get("users/:id/detail")
  async getUserDetail(@Param("id") id: string) {
    const [appointmentsCount, paymentsSum, clientsCount, servicesCount] = await Promise.all([
      this.prisma.appointment.count({ where: { userId: id } }),
      this.prisma.payment.aggregate({
        where: { appointment: { userId: id }, status: "PAID" },
        _sum: { amount: true },
      }),
      this.prisma.client.count({ where: { userId: id } }),
      this.prisma.service.count({ where: { userId: id } }),
    ]);

    const user = await this.usersRepository.findById(id);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      role: user.role,
      plan: user.plan,
      createdAt: user.createdAt,
      stats: {
        totalAppointments: appointmentsCount,
        totalRevenue: paymentsSum._sum.amount ?? 0,
        totalClients: clientsCount,
        totalServices: servicesCount,
      },
    };
  }

  @Patch("users/:id/plan")
  async updatePlan(@Param("id") id: string, @Body("plan") plan: UserPlan) {
    return this.usersRepository.update(id, { plan });
  }

  @Get("stats")
  async getStats() {
    const users = await this.usersRepository.findAll();

    const [totalAppointments, totalRevenue, totalClients, recentUsers] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      this.prisma.client.count(),
      this.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, businessName: true, plan: true, createdAt: true },
      }),
    ]);

    // Users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = users.filter(u => new Date(u.createdAt) >= startOfMonth).length;

    return {
      totalUsers: users.length,
      proUsers: users.filter(u => u.plan === "PRO").length,
      enterpriseUsers: users.filter(u => u.plan === "ENTERPRISE").length,
      onboardingUsers: users.filter(u => u.plan === "ONBOARDING").length,
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
      user.id, user.email, user.name, user.role, user.plan, (user as any).businessId,
    );
  }

  // --- Business Management ---
  @Get("businesses")
  async listBusinesses() {
    return this.prisma.business.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        staff: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { staff: true, products: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("businesses/:id")
  async getBusiness(@Param("id") id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        staff: { select: { id: true, name: true, email: true, role: true, baseCommission: true } },
        products: { select: { id: true, name: true, price: true, stock: true } },
      },
    });
  }

  @Post("businesses")
  async createBusiness(@Body() body: { name: string; slug: string; ownerId: string; plan?: string }) {
    const business = await this.prisma.business.create({
      data: {
        name: body.name,
        slug: body.slug,
        plan: (body.plan as any) || "PRO",
        status: "ACTIVE",
        ownerId: body.ownerId,
      },
    });

    // Link the owner to the business
    await this.prisma.user.update({
      where: { id: body.ownerId },
      data: { businessId: business.id, plan: body.plan as any || "PRO" },
    });

    return business;
  }

  @Patch("businesses/:id")
  async updateBusiness(@Param("id") id: string, @Body() body: {
    name?: string;
    slug?: string;
    plan?: string;
    status?: string;
    addStaff?: { name: string; email: string; commission?: number };
  }) {
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.slug) updates.slug = body.slug;
    if (body.plan) updates.plan = body.plan;
    if (body.status) updates.status = body.status;

    const business = await this.prisma.business.update({ where: { id }, data: updates });

    // If adding a staff member
    if (body.addStaff) {
      await this.prisma.user.create({
        data: {
          name: body.addStaff.name,
          email: body.addStaff.email,
          passwordHash: "temporary_hash",
          role: "PROFESSIONAL",
          businessId: id,
          baseCommission: body.addStaff.commission ?? 30,
          plan: business.plan,
        },
      });
    }

    return business;
  }

  @Post("businesses/:id/link-user")
  async linkUserToBusiness(@Param("id") id: string, @Body() body: { userId: string }) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    return this.prisma.user.update({
      where: { id: body.userId },
      data: {
        businessId: id,
        plan: business?.plan ?? "PRO",
      },
    });
  }
}
