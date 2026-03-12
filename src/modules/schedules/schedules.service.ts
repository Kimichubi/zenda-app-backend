import { Injectable } from "@nestjs/common";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesService {
  constructor(private readonly schedulesRepository: SchedulesRepository) { }

  list(userId: string) {
    return this.schedulesRepository.list(userId);
  }

  upsert(userId: string, dto: UpsertScheduleDto) {
    return this.schedulesRepository.upsert(userId, dto);
  }
}
