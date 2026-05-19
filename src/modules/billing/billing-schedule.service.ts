import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BillingService } from "./billing.service";

@Injectable()
export class BillingScheduleService {
  private readonly logger = new Logger(BillingScheduleService.name);

  constructor(private readonly billingService: BillingService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async expireTrials() {
    this.logger.log("Running trial expiry check...");
    const result = await this.billingService.expireTrials();
    this.logger.log(`Trial expiry check complete: ${result.expired} expired`);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async processOverdue() {
    this.logger.log("Processing overdue invoices...");
    const result = await this.billingService.processOverdueInvoices();
    if (result.processed > 0) {
      this.logger.log(`Processed ${result.processed} overdue invoices`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cancelExpiredGrace() {
    this.logger.log("Cancelling expired grace period subscriptions...");
    const result = await this.billingService.cancelExpiredGrace();
    if (result.cancelled > 0) {
      this.logger.log(`Cancelled ${result.cancelled} subscriptions with expired grace`);
    }
  }
}
