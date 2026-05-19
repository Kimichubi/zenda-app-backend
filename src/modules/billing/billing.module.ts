import { Module } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { AdminBillingController } from "./admin-billing.controller";
import { BillingScheduleService } from "./billing-schedule.service";
import { AbacateClient } from "./abacate/abacate.client";
import { BillingEventPublisher } from "./events/billing-event-publisher";
import { AuditModule } from "../../infrastructure/audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [BillingController, AdminBillingController],
  providers: [
    BillingService,
    AbacateClient,
    BillingEventPublisher,
    BillingScheduleService,
  ],
  exports: [BillingService],
})
export class BillingModule {}
