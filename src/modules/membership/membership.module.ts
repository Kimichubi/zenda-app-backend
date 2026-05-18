import { Module } from "@nestjs/common";
import { MembershipPlanController } from "./membership-plan.controller";
import { MembershipPlanService } from "./membership-plan.service";
import { ClientSubscriptionController } from "./client-subscription.controller";
import { ClientSubscriptionService } from "./client-subscription.service";

@Module({
  controllers: [MembershipPlanController, ClientSubscriptionController],
  providers: [MembershipPlanService, ClientSubscriptionService],
  exports: [MembershipPlanService, ClientSubscriptionService],
})
export class MembershipModule {}
