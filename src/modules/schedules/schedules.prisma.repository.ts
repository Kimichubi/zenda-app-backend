import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ScheduleEntity } from "./schedules.entity";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesPrismaRepository implements SchedulesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async list(userId: string): Promise<ScheduleEntity[]> {
    return this.prisma.schedule.findMany({
      where: { userId },
      orderBy: { weekday: "asc" },
    });
  }

  async upsert(
    userId: string,
    input: { weekday: number; startTime: string; endTime: string },
  ): Promise<ScheduleEntity> {
    return this.prisma.schedule.upsert({
      where: {
        userId_weekday: { userId, weekday: input.weekday },
      },
      update: {
        startTime: input.startTime,
        endTime: input.endTime,
      },
      create: {
        userId,
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });
  }
}
