import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { AppointmentsModule } from "../appointments/appointments.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [AppointmentsModule, PaymentsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
