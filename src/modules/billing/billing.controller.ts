import { Controller, Get, Post, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get("subscription")
  async getSubscription(@Req() req: any) {
    return this.billingService.getBusinessSubscription(req.user.businessId);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Get("invoices")
  async getInvoices(@Req() req: any) {
    return this.billingService.getInvoices(req.user.businessId);
  }

  @UseGuards(JwtAuthGuard, BusinessGuard)
  @Post("generate-invoice")
  async generateInvoice(@Req() req: any) {
    return this.billingService.generateInvoice(req.user.businessId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("webhook")
  async webhook(@Req() req: any) {
    return this.billingService.handleWebhook(req.body);
  }
}
