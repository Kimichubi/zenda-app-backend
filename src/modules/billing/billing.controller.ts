import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, Req, Headers, Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { BillingService } from "./billing.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { CancelSubscriptionDto } from "./dto/cancel-subscription.dto";
import { ChangePlanDto } from "./dto/change-plan.dto";
import { IdempotencyKey } from "./decorators/idempotency.decorator";

@Controller("billing")
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get("plans")
  async listPlans() {
    return this.billingService.listPlans();
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get("subscription")
  async getSubscription(@Req() req: any) {
    return this.billingService.getSubscription(req.user.businessId);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Post("checkout")
  async createCheckout(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckout(req.user.businessId, dto);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get("invoices")
  async getInvoices(@Req() req: any) {
    return this.billingService.getInvoices(req.user.businessId);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get("invoices/:id")
  async getInvoice(@Req() req: any, @Param("id") id: string) {
    return this.billingService.getInvoice(id, req.user.businessId);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Patch("cancel")
  async cancelSubscription(@Req() req: any, @Body() dto: CancelSubscriptionDto) {
    return this.billingService.cancelSubscription(req.user.businessId, dto.reason);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Patch("plan")
  async changePlan(@Req() req: any, @Body() dto: ChangePlanDto) {
    return this.billingService.changePlan(req.user.businessId, dto.planId, dto.billingType);
  }

  @Post("webhook")
  async handleWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @IdempotencyKey() idempotencyKey?: string | null,
  ) {
    this.logger.log(`Webhook received: ${payload.event}`);
    return this.billingService.handleWebhook(payload, headers, idempotencyKey);
  }
}
