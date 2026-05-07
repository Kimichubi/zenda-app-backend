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

  async upsert(
    businessId: string,
    professionalId: string,
    input: { weekday: number; startTime: string; endTime: string },
  ): Promise<ScheduleEntity> {
    const existing = this.db.schedules.find(
      (s) => s.businessId === businessId && s.professionalId === professionalId && s.weekday === input.weekday,
    );

    if (existing) {
      existing.startTime = input.startTime;
      existing.endTime = input.endTime;
      return existing;
    }

    const schedule = {
      id: makeId(),
      businessId,
      professionalId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
    };

    this.db.schedules.push(schedule);
    return schedule;
  }
}
