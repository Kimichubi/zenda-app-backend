import { ScheduleEntity } from "./schedules.entity";

export abstract class SchedulesRepository {
  abstract list(userId: string): Promise<ScheduleEntity[]>;
  abstract upsert(
    userId: string,
    input: { weekday: number; startTime: string; endTime: string },
  ): Promise<ScheduleEntity>;
}
