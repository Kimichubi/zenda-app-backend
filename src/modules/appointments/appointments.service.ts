import { ConflictException, Injectable } from "@nestjs/common";
import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  findAll(userId: string) {
    return this.appointmentsRepository.findManyByUserId(userId);
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    const date = new Date(dto.date);
    const conflict = await this.appointmentsRepository.findConflict(
      userId,
      date,
    );
    if (conflict) {
      throw new ConflictException("Appointment conflict detected");
    }

    return this.appointmentsRepository.create(userId, {
      clientId: dto.clientId,
      date,
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    if (!dto.status) {
      return null;
    }
    return this.appointmentsRepository.updateStatus(id, userId, dto.status);
  }
}
