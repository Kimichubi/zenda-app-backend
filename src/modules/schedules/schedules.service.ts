import { Injectable } from "@nestjs/common";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
import { SchedulesRepository } from "./schedules.repository";
import { BlockedSlotEntity } from "./schedules.entity";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { BlockedReason } from "@prisma/client";

@Injectable()
export class SchedulesService {
  constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly prisma: PrismaService,
  ) {}

  listByBusiness(businessId: string) {
    return this.schedulesRepository.listByBusinessId(businessId);
  }

  listByProfessional(professionalId: string) {
    return this.schedulesRepository.listByProfessionalId(professionalId);
  }

  upsert(businessId: string, professionalId: string, dto: UpsertScheduleDto) {
    return this.schedulesRepository.upsert(businessId, professionalId, {
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDuration: dto.slotDuration,
      isActive: dto.isActive,
      breakStart: dto.breakStart,
      breakEnd: dto.breakEnd,
    });
  }

  async blockSlot(
    businessId: string,
    professionalId: string,
    input: {
      date: Date;
      startTime: string;
      endTime: string;
      reason?: BlockedReason;
    },
  ): Promise<BlockedSlotEntity> {
    return this.prisma.blockedSlot.create({
      data: {
        businessId,
        professionalId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        reason: input.reason ?? "MANUAL_BLOCK",
      },
    }) as any;
  }

  async unblockSlot(id: string, businessId: string): Promise<void> {
    await this.prisma.blockedSlot.deleteMany({
      where: { id, businessId },
    });
  }

  async listBlockedSlots(professionalId: string, startDate: Date, endDate: Date): Promise<BlockedSlotEntity[]> {
    return this.prisma.blockedSlot.findMany({
      where: {
        professionalId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    }) as any;
  }
}