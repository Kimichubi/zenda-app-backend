import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { ServicesRepository } from "../services/services.repository";
import { ClientsRepository } from "../clients/clients.repository";
import { UsersRepository } from "../users/users.repository";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";
import { PaymentsRepository } from "../payments/payments.repository";
import { PaymentStatus } from "../payments/payments.entity";

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly whatsappService: WhatsappService,
    private readonly paymentsRepository: PaymentsRepository,
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

    if (price && price > 0) {
      await this.paymentsRepository.create({
        appointmentId: appointment.id,
        amount: price,
        status: "PENDING"
      });
    }

    if (dto.startTime) {
      this.notifyClient(userId, dto.clientId, serviceName, dto.date, dto.startTime).catch(err => {
        this.logger.error(`Failed to notify client: ${err.message}`);
      });
    }

    return appointment;
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.appointmentsRepository.updateStatus(id, userId, dto.status || "SCHEDULED");
    
    if (appointment && dto.status) {
      if (dto.status === "CANCELLED") {
        await this.syncPaymentStatus(id, "CANCELLED", "Agendamento cancelado");
      } else if (dto.status === "NO_SHOW") {
        await this.syncPaymentStatus(id, "FAILED", "Cliente não compareceu");
      }
    }

    return appointment;
  }

  private async syncPaymentStatus(appointmentId: string, status: PaymentStatus, reason: string) {
    try {
      const payment = await this.paymentsRepository.findByAppointmentId(appointmentId);
      if (payment) {
        await this.paymentsRepository.updateStatus(payment.id, status, reason);
      }
    } catch (err) {
      this.logger.error(`Failed to sync payment status for appointment ${appointmentId}: ${err.message}`);
    }
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
}
