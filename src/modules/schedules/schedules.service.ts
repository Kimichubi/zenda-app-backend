import { Injectable } from "@nestjs/common";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
import { SchedulesRepository } from "./schedules.repository";

@Injectable()
export class SchedulesService {
  constructor(private readonly schedulesRepository: SchedulesRepository) { }

  listByBusiness(businessId: string) {
    return this.schedulesRepository.listByBusinessId(businessId);
  }

  listByProfessional(professionalId: string) {
    return this.schedulesRepository.listByProfessionalId(professionalId);
  }

  upsert(businessId: string, professionalId: string, dto: UpsertScheduleDto) {
    return this.schedulesRepository.upsert(businessId, professionalId, dto);
  }
}
