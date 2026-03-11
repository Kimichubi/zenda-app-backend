import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { ClientsController } from "./clients.controller";
import { ClientsInMemoryRepository } from "./clients.in-memory.repository";
import { ClientsPrismaRepository } from "./clients.prisma.repository";
import { ClientsRepository } from "./clients.repository";
import { ClientsService } from "./clients.service";

const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
  ? [
      {
        provide: ClientsRepository,
        useExisting: ClientsInMemoryRepository,
      },
    ]
  : [
      ClientsPrismaRepository,
      {
        provide: ClientsRepository,
        useExisting: ClientsPrismaRepository,
      },
    ];

@Module({
  imports: [DatabaseModule],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    ClientsInMemoryRepository,
    ...repositoryProviders,
  ],
  exports: [ClientsService, ClientsRepository],
})
export class ClientsModule {}
