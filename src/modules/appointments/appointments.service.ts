import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { ServicesRepository } from "../services/services.repository";
import { ClientsRepository } from "../clients/clients.repository";
import { UsersRepository } from "../users/users.repository";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly whatsappService: WhatsappService,
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
    let serviceName = "Serviço";

    if (dto.serviceId) {
      const service = await this.servicesRepository.findById(dto.serviceId);
      if (service && dto.startTime) {
        serviceName = service.name;
        const [h, m] = dto.startTime.split(":").map(Number);
        const endMinutes = h * 60 + m + service.duration;
        endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
        price = dto.price ?? service.price;
      }
    }

    const appointment = await this.appointmentsRepository.create(userId, {
      clientId: dto.clientId,
      serviceId: dto.serviceId,
      date,
      startTime: dto.startTime,
      endTime,
      price,
    });

    // Notify client via WhatsApp
    if (dto.startTime) {
      this.notifyClient(userId, dto.clientId, serviceName, dto.date, dto.startTime).catch(err => {
        this.logger.error(`Failed to notify client: ${err.message}`);
      });
    }

    return appointment;
  }

  private async notifyClient(
    userId: string,
    clientId: string,
    serviceName: string,
    date: string,
    time: string
  ) {
    const [client, user] = await Promise.all([
      this.clientsRepository.findById(clientId),
      this.usersRepository.findById(userId)
    ]);

    if (client && user) {
      await this.whatsappService.sendConfirmation(client.phone, {
        clientName: client.name,
        serviceName,
        date: new Date(date).toLocaleDateString("pt-BR"),
        time,
        businessName: user.businessName
      });
    }
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    if (!dto.status) {
      return null;
    }
    return this.appointmentsRepository.updateStatus(id, userId, dto.status);
  }
}
