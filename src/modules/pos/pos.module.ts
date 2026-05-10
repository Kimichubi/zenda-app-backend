import { Module, forwardRef } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { PosController } from "./pos.controller";
import { PosService } from "./pos.service";
import { PaymentsModule } from "../payments/payments.module";
import { AppointmentsModule } from "../appointments/appointments.module";

@Module({
  imports: [DatabaseModule, forwardRef(() => PaymentsModule), forwardRef(() => AppointmentsModule)],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
