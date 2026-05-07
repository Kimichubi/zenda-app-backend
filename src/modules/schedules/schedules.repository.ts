import { ScheduleEntity } from "./schedules.entity";

export abstract class SchedulesRepository {
  abstract listByBusinessId(businessId: string): Promise<ScheduleEntity[]>;
  abstract listByProfessionalId(professionalId: string): Promise<ScheduleEntity[]>;
  abstract upsert(
    businessId: string,
    professionalId: string,
    input: { weekday: number; startTime: string; endTime: string },
  ): Promise<ScheduleEntity>;
}
