import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PlatformAdminGuard } from "../../common/guards/platform-admin.guard";
import { BillingService } from "./billing.service";

@Controller("admin/billing")
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("subscriptions")
  async listSubscriptions() {
    return this.billingService.adminListSubscriptions();
  }

  @Get("stats")
  async getStats() {
    return this.billingService.adminGetStats();
  }
}
