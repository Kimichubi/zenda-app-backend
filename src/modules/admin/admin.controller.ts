import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { UsersRepository } from "../users/users.repository";
import { UserPlan } from "../users/users.entity";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly usersRepository: UsersRepository) {}

  @Get("users")
  async listUsers() {
    const users = await this.usersRepository.findAll();
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      businessName: u.businessName,
      role: u.role,
      plan: u.plan,
      createdAt: u.createdAt
    }));
  }

  @Patch("users/:id/plan")
  async updatePlan(@Param("id") id: string, @Body("plan") plan: UserPlan) {
    return this.usersRepository.update(id, { plan });
  }

  @Get("stats")
  async getStats() {
    const users = await this.usersRepository.findAll();
    return {
      totalUsers: users.length,
      proUsers: users.filter(u => u.plan === "PRO").length,
      enterpriseUsers: users.filter(u => u.plan === "ENTERPRISE").length,
      freeUsers: users.filter(u => u.plan === "FREE").length,
    };
  }
}
