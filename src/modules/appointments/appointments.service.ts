import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { ServicesRepository } from "../services/services.repository";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AppointmentStatus } from "@prisma/client";
import { CommissionService } from "../admin/commission.service";

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
  ) { }

  async create(userId: string, dto: CreateAppointmentDto) {
    let endTime: string | undefined;
    let price: number | undefined;

    if (dto.serviceId) {
      const service = await this.servicesRepository.findById(dto.serviceId);
      if (!service) throw new NotFoundException("Service not found");
      price = service.price;

      if (dto.startTime) {
        const [h, m] = dto.startTime.split(":").map(Number);
        const endMinutes = h * 60 + m + service.duration;
        endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      }
    }

    const appointment = await this.appointmentsRepository.create(userId, {
      clientId: dto.clientId,
      serviceId: dto.serviceId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime,
      price: dto.price ?? price,
    });

    await this.sendNotification(userId, appointment.id);

    return appointment;
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    let endTime: string | undefined;
    let price: number | undefined;

    if (dto.serviceId || dto.startTime) {
      const current = await this.appointmentsRepository.findById(id);
      if (current) {
        const serviceId = dto.serviceId || current.serviceId;
        const startTime = dto.startTime || current.startTime;
        
        if (serviceId && startTime) {
          const service = await this.servicesRepository.findById(serviceId);
          if (service) {
            const [h, m] = startTime.split(":").map(Number);
            const endMinutes = h * 60 + m + service.duration;
            endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
            price = dto.price ?? service.price;
          }
        }
      }
    }

    const appointment = await this.appointmentsRepository.update(id, userId, {
      ...dto,
      endTime,
      price,
    });

    if (appointment && dto.status) {
      if (dto.status === "CANCELLED") {
        await this.syncPaymentStatus(id, "CANCELLED", "Agendamento cancelado");
      } else if (dto.status === "NO_SHOW") {
        await this.syncPaymentStatus(id, "FAILED", "Cliente não compareceu");
      } else if (dto.status === "COMPLETED") {
        await this.commissionService.calculateForAppointment(id);
      }
    }
    return appointment;
  }

  async listForUser(userId: string, date?: string) {
    if (date) {
      return this.appointmentsRepository.findManyByUserIdAndDate(userId, new Date(date));
    }
    return this.appointmentsRepository.findManyByUserId(userId);
  }

  async listWeekly(userId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return this.appointmentsRepository.findRangeByUserId(userId, start, end);
  }

  async resendNotification(userId: string, appointmentId: string): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(appointmentId);
    if (!appointment) throw new NotFoundException("Appointment not found");
    await this.sendNotification(userId, appointmentId);
  }

  private async syncPaymentStatus(appointmentId: string, status: any, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { appointmentId } });
    if (payment && payment.status !== "PAID") {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status, reason },
      });
    }
  }

  private async sendNotification(userId: string, appointmentId: string) {
    const appointment: any = await this.appointmentsRepository.findById(appointmentId);
    if (!appointment) return;

    const { client, service, startTime: time, date, user } = appointment;
    const serviceName = service?.name || "Serviço";

    try {
      await this.whatsappService.sendConfirmation(userId, client.phone, {
        clientName: client.name,
        serviceName,
        date: new Date(date).toLocaleDateString("pt-BR"),
        time,
        businessName: user.businessName || user.name
      });
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp notification: ${error.message}`);
    }
  }
}
