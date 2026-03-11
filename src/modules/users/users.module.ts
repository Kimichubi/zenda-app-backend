import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { UsersController } from "./users.controller";
import { UsersInMemoryRepository } from "./users.in-memory.repository";
import { UsersPrismaRepository } from "./users.prisma.repository";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
  ? [
      {
        provide: UsersRepository,
        useExisting: UsersInMemoryRepository,
      },
    ]
  : [
      UsersPrismaRepository,
      {
        provide: UsersRepository,
        useExisting: UsersPrismaRepository,
      },
    ];

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersInMemoryRepository, ...repositoryProviders],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
