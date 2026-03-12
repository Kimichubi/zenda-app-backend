import { ConflictException, Injectable } from "@nestjs/common";
import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { ServicesRepository } from "../services/services.repository";

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly servicesRepository: ServicesRepository,
  ) { }

  findAll(userId: string) {
    return this.appointmentsRepository.findManyByUserId(userId);
  }

  getByWeek(userId: string, start: string) {
    const startDate = new Date(start);
    return this.appointmentsRepository.findByWeek(userId, startDate);
  }

  findByClientId(clientId: string) {
    return this.appointmentsRepository.findByClientId(clientId);
  }

  async create(userId: string, dto: CreateAppointmentDto) {
    const date = new Date(dto.date);
    const conflict = await this.appointmentsRepository.findConflict(
      userId,
      date,
      dto.startTime,
    );
    if (conflict) {
      throw new ConflictException("Appointment conflict detected");
    }

    let endTime: string | undefined;
    let price: number | undefined;

    if (dto.serviceId) {
      const service = await this.servicesRepository.findById(dto.serviceId);
      if (service && dto.startTime) {
        const [h, m] = dto.startTime.split(":").map(Number);
        const endMinutes = h * 60 + m + service.duration;
        endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
        price = dto.price ?? service.price;
      }
    }

    return this.appointmentsRepository.create(userId, {
      clientId: dto.clientId,
      serviceId: dto.serviceId,
      date,
      startTime: dto.startTime,
      endTime,
      price,
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    if (!dto.status) {
      return null;
    }
    return this.appointmentsRepository.updateStatus(id, userId, dto.status);
  }
}
