import { Injectable } from "@nestjs/common";
import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { makeId } from "../../infrastructure/database/id.factory";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";

@Injectable()
export class SchedulesService {
  constructor(private readonly db: InMemoryDatabaseService) {}

  list(userId: string) {
    return this.db.schedules.filter((item) => item.userId === userId);
  }

  upsert(userId: string, dto: UpsertScheduleDto) {
    const existing = this.db.schedules.find(
      (schedule) =>
        schedule.userId === userId && schedule.weekday === dto.weekday,
    );

    if (existing) {
      existing.startTime = dto.startTime;
      existing.endTime = dto.endTime;
      return existing;
    }

    const schedule = {
      id: makeId(),
      userId,
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
    };

    this.db.schedules.push(schedule);
    return schedule;
  }
}
