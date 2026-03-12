import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { ScheduleEntity } from "./schedules.entity";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesInMemoryRepository implements SchedulesRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async list(userId: string): Promise<ScheduleEntity[]> {
    return this.db.schedules.filter((s) => s.userId === userId);
  }

  async upsert(
    userId: string,
    input: { weekday: number; startTime: string; endTime: string },
  ): Promise<ScheduleEntity> {
    const existing = this.db.schedules.find(
      (s) => s.userId === userId && s.weekday === input.weekday,
    );

    if (existing) {
      existing.startTime = input.startTime;
      existing.endTime = input.endTime;
      return existing;
    }

    const schedule = {
      id: makeId(),
      userId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
    };

    this.db.schedules.push(schedule);
    return schedule;
  }
}
