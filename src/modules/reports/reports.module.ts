import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { AppointmentsModule } from "../appointments/appointments.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [AppointmentsModule, PaymentsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
