import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { UserPlan } from "../users/users.entity";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
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
      freeUsers: users.filter(u => u.plan === "FREE").length,
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      totalClients,
      newThisMonth,
      recentUsers,
    };
  }
}
