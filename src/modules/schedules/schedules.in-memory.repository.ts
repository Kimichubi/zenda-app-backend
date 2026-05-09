import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { ScheduleEntity } from "./schedules.entity";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesInMemoryRepository implements SchedulesRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async listByBusinessId(businessId: string): Promise<ScheduleEntity[]> {
    return this.db.schedules.filter((s) => s.businessId === businessId);
  }

  async listByProfessionalId(professionalId: string): Promise<ScheduleEntity[]> {
    return this.db.schedules.filter((s) => s.professionalId === professionalId);
  }

  async findByProfessionalAndWeekday(professionalId: string, weekday: number): Promise<ScheduleEntity | null> {
    return this.db.schedules.find(
      (s) => s.professionalId === professionalId && s.weekday === weekday,
    ) || null;
  }

  async upsert(
    businessId: string,
    professionalId: string,
    input: { weekday: number; startTime: string; endTime: string; slotDuration?: number; isActive?: boolean; breakStart?: string; breakEnd?: string },
  ): Promise<ScheduleEntity> {
    const existing = this.db.schedules.find(
      (s) => s.businessId === businessId && s.professionalId === professionalId && s.weekday === input.weekday,
    );

    if (existing) {
      existing.startTime = input.startTime;
      existing.endTime = input.endTime;
      existing.slotDuration = input.slotDuration ?? existing.slotDuration;
      existing.isActive = input.isActive ?? existing.isActive;
      existing.breakStart = input.breakStart ?? existing.breakStart;
      existing.breakEnd = input.breakEnd ?? existing.breakEnd;
      return existing;
    }

    const schedule = {
      id: makeId(),
      businessId,
      professionalId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      slotDuration: input.slotDuration ?? 30,
      isActive: input.isActive ?? true,
      breakStart: input.breakStart ?? null,
      breakEnd: input.breakEnd ?? null,
    };

    this.db.schedules.push(schedule as any);
    return schedule;
  }
}