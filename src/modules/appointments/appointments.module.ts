import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsInMemoryRepository } from "./appointments.in-memory.repository";
import { AppointmentsPrismaRepository } from "./appointments.prisma.repository";
import { AppointmentsRepository } from "./appointments.repository";
import { AppointmentsService } from "./appointments.service";
import { ServicesModule } from "../services/services.module";

const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
  ? [
    {
      provide: AppointmentsRepository,
      useExisting: AppointmentsInMemoryRepository,
    },
  ]
  : [
    AppointmentsPrismaRepository,
    {
      provide: AppointmentsRepository,
      useExisting: AppointmentsPrismaRepository,
    },
  ];

@Module({
  imports: [DatabaseModule, ServicesModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentsInMemoryRepository,
    ...repositoryProviders,
  ],
  exports: [AppointmentsRepository, AppointmentsService],
})
export class AppointmentsModule { }
