import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ScheduleEntity } from "./schedules.entity";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesPrismaRepository implements SchedulesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async listByBusinessId(businessId: string): Promise<ScheduleEntity[]> {
    return this.prisma.schedule.findMany({
      where: { businessId },
      include: { professional: { select: { id: true, name: true } } },
      orderBy: { weekday: "asc" },
    });
  }

  async listByProfessionalId(professionalId: string): Promise<ScheduleEntity[]> {
    return this.prisma.schedule.findMany({
      where: { professionalId },
      orderBy: { weekday: "asc" },
    });
  }

  async upsert(
    businessId: string,
    professionalId: string,
    input: { weekday: number; startTime: string; endTime: string },
  ): Promise<ScheduleEntity> {
    return this.prisma.schedule.upsert({
      where: {
        businessId_professionalId_weekday: {
          businessId,
          professionalId,
          weekday: input.weekday,
        },
      },
      update: {
        startTime: input.startTime,
        endTime: input.endTime,
      },
      create: {
        businessId,
        professionalId,
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });
  }
}
