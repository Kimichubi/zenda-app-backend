import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { SchedulesController } from "./schedules.controller";
import { SchedulesInMemoryRepository } from "./schedules.in-memory.repository";
import { SchedulesPrismaRepository } from "./schedules.prisma.repository";
import { SchedulesRepository } from "./schedules.repository";
import { SchedulesService } from "./schedules.service";

const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
  ? [
    {
      provide: SchedulesRepository,
      useExisting: SchedulesInMemoryRepository,
    },
  ]
  : [
    SchedulesPrismaRepository,
    {
      provide: SchedulesRepository,
      useExisting: SchedulesPrismaRepository,
    },
  ];

@Module({
  imports: [DatabaseModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    SchedulesInMemoryRepository,
    ...repositoryProviders,
  ],
  exports: [SchedulesService, SchedulesRepository],
})
export class SchedulesModule { }
