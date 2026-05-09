import { ScheduleEntity } from "./schedules.entity";

export abstract class SchedulesRepository {
  abstract listByBusinessId(businessId: string): Promise<ScheduleEntity[]>;
  abstract listByProfessionalId(professionalId: string): Promise<ScheduleEntity[]>;
  abstract findByProfessionalAndWeekday(professionalId: string, weekday: number): Promise<ScheduleEntity | null>;
  abstract upsert(
    businessId: string,
    professionalId: string,
    input: { weekday: number; startTime: string; endTime: string; slotDuration?: number; isActive?: boolean; breakStart?: string; breakEnd?: string },
  ): Promise<ScheduleEntity>;
}