import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../../common/guards/platform-admin.guard";
import { BillingService } from "./billing.service";
import { CreateBillingPlanDto, UpdateBillingPlanDto } from "./dto/subscription-plan.dto";

@Controller("admin/billing")
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminBillingController {
  private readonly logger = new Logger(AdminBillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Get("subscriptions")
  async listSubscriptions(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.billingService.adminListSubscriptions({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("subscriptions/:id")
  async getSubscriptionDetail(@Param("id") id: string) {
    return this.billingService.adminGetSubscriptionDetail(id);
  }

  @Get("stats")
  async getStats() {
    return this.billingService.adminGetStats();
  }

  @Get("plans")
  async listPlans(@Query("all") all?: string) {
    return this.billingService.listPlans(all !== "true");
  }

  @Post("plans")
  async createPlan(@Body() dto: CreateBillingPlanDto) {
    return this.billingService.adminCreatePlan(dto as any);
  }

  @Patch("plans/:id")
  async updatePlan(@Param("id") id: string, @Body() dto: UpdateBillingPlanDto) {
    return this.billingService.adminUpdatePlan(id, dto as any);
  }

  @Post("retry-overdue")
  async processOverdue() {
    return this.billingService.processOverdueInvoices();
  }

  @Post("expire-trials")
  async expireTrials() {
    return this.billingService.expireTrials();
  }

  @Post("cancel-expired-grace")
  async cancelExpiredGrace() {
    return this.billingService.cancelExpiredGrace();
  }
}
