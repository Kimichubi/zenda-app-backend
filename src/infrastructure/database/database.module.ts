import { Global, Module } from "@nestjs/common";
import { InMemoryDatabaseService } from "./in-memory-database.service";
import { PrismaService } from "./prisma.service";

const isTestEnv = process.env.NODE_ENV === "test";
const providers = isTestEnv
  ? [InMemoryDatabaseService]
  : [InMemoryDatabaseService, PrismaService];

@Global()
@Module({
  providers,
  exports: providers,
})
export class DatabaseModule {}
