import { Module, forwardRef } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsInMemoryRepository } from "./payments.in-memory.repository";
import { PaymentsPrismaRepository } from "./payments.prisma.repository";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";
import { AppointmentsModule } from "../appointments/appointments.module";

const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
  ? [
    {
      provide: PaymentsRepository,
      useExisting: PaymentsInMemoryRepository,
    },
  ]
  : [
    PaymentsPrismaRepository,
    {
      provide: PaymentsRepository,
      useExisting: PaymentsPrismaRepository,
    },
  ];

@Module({
  imports: [DatabaseModule, forwardRef(() => AppointmentsModule)],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsInMemoryRepository,
    ...repositoryProviders,
  ],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule { }
