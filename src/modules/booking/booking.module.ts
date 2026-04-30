import { Module, forwardRef } from "@nestjs/common";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { UsersModule } from "../users/users.module";
import { ServicesModule } from "../services/services.module";
import { AppointmentsModule } from "../appointments/appointments.module";
import { ClientsModule } from "../clients/clients.module";
import { SchedulesModule } from "../schedules/schedules.module";

@Module({
  imports: [
    UsersModule,
    ServicesModule,
    forwardRef(() => AppointmentsModule),
    ClientsModule,
    SchedulesModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule { }
