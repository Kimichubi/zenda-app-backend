import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const dbHealthy = await this.checkDatabase();

    return {
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? "connected" : "disconnected",
        api: "running",
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
