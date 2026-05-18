import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
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
import { LoggingModule } from "./infrastructure/logging/logging.module";
import { AuditModule } from "./infrastructure/audit/audit.module";
import { envSchema } from "./infrastructure/config/env.validation";
import { AdminModule } from "./modules/admin/admin.module";
import { SiteSettingsModule } from "./modules/site-settings/site-settings.module";
import { WhatsappModule } from "./modules/whatsapp/whatsapp.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { UploadModule } from "./modules/uploads/upload.module";
import { PosModule } from "./modules/pos/pos.module";
import { PixProviderModule } from "./modules/payments/pix-provider.module";
import { HealthModule } from "./modules/health/health.module";
import { MembershipModule } from "./modules/membership/membership.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { HttpLoggingInterceptor } from "./infrastructure/logging/http-logging.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 5,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    LoggingModule,
    AuditModule,
    PixProviderModule,
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
    UploadModule,
    PosModule,
    HealthModule,
    MembershipModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
