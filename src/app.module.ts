import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
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
import { AdminModule } from "./modules/admin/admin.module";
import { SiteSettingsModule } from "./modules/site-settings/site-settings.module";
import { WhatsappModule } from "./modules/whatsapp/whatsapp.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ScheduleModule.forRoot(),
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
    AdminModule,
    SiteSettingsModule,
    WhatsappModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }