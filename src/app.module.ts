import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { BookingModule } from "./modules/booking/booking.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { SchedulesModule } from "./modules/schedules/schedules.module";
import { ServicesModule } from "./modules/services/services.module";
import { UsersModule } from "./modules/users/users.module";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { envSchema } from "./infrastructure/config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    AppointmentsModule,
    PaymentsModule,
    SchedulesModule,
    DashboardModule,
    ServicesModule,
    BookingModule,
  ],
})
export class AppModule { }
