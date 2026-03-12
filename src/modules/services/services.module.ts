import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { ServicesController } from "./services.controller";
import { ServicesInMemoryRepository } from "./services.in-memory.repository";
import { ServicesPrismaRepository } from "./services.prisma.repository";
import { ServicesRepository } from "./services.repository";
import { ServicesService } from "./services.service";

const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
  ? [
    {
      provide: ServicesRepository,
      useExisting: ServicesInMemoryRepository,
    },
  ]
  : [
    ServicesPrismaRepository,
    {
      provide: ServicesRepository,
      useExisting: ServicesPrismaRepository,
    },
  ];

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    ServicesInMemoryRepository,
    ...repositoryProviders,
  ],
  exports: [ServicesService, ServicesRepository],
})
export class ServicesModule { }
