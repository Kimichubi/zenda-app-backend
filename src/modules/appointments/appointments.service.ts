import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { ServicesRepository } from "../services/services.repository";
import { WhatsappService } from "../../infrastructure/notifications/whatsapp.service";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CommissionService } from "../admin/commission.service";
import { AvailabilityService } from "../schedules/availability.service";

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly whatsappService: WhatsappService,
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(businessId: string, professionalId: string, dto: CreateAppointmentDto) {
    let endTime: string | undefined;
    let price: number | undefined;
    let serviceDuration = 30;

    if (dto.serviceId) {
      const service = await this.servicesRepository.findById(dto.serviceId);
      if (!service) throw new NotFoundException("Service not found");
      price = service.price;
      serviceDuration = service.duration;

      if (dto.startTime) {
        const [h, m] = dto.startTime.split(":").map(Number);
        const endMinutes = h * 60 + m + serviceDuration;
        endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      }
    }

    if (dto.startTime && dto.professionalId) {
      const effectiveProfessionalId = dto.professionalId || professionalId;
      await this.availabilityService.validateBooking(
        effectiveProfessionalId,
        dto.date,
        dto.startTime,
        dto.serviceId,
      );
    }

    const appointment = await this.appointmentsRepository.create({
      businessId,
      professionalId,
      clientId: dto.clientId,
      serviceId: dto.serviceId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime,
      price: dto.price ?? price,
    });

    await this.sendNotification(businessId, appointment.id);

    return appointment;
  }

  async update(businessId: string, id: string, dto: UpdateAppointmentDto) {
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

    const appointment = await this.appointmentsRepository.update(id, businessId, {
      ...dto,
      endTime,
      price,
    });

    if (appointment && dto.status) {
      if (dto.status === "CANCELLED") {
        await this.syncPaymentStatus(id, "CANCELLED", "Agendamento cancelado");
      } else if (dto.status === "NO_SHOW") {
        await this.syncPaymentStatus(id, "FAILED", "Cliente nao compareceu");
      } else if (dto.status === "COMPLETED") {
        await this.commissionService.calculateForAppointment(id);
      }
    }
    return appointment;
  }

  async listForUser(professionalId: string, date?: string) {
    if (date) {
      return this.appointmentsRepository.findTodayByProfessionalId(professionalId);
    }
    return this.appointmentsRepository.findManyByProfessionalId(professionalId);
  }

  async listForBusiness(businessId: string, date?: string) {
    if (date) {
      return this.appointmentsRepository.findManyByBusinessIdAndDate(businessId, new Date(date));
    }
    return this.appointmentsRepository.findManyByBusinessId(businessId);
  }

  async listWeekly(businessId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return this.appointmentsRepository.findRangeByBusinessId(businessId, start, end);
  }

  async resendNotification(businessId: string, appointmentId: string): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(appointmentId);
    if (!appointment) throw new NotFoundException("Appointment not found");
    await this.sendNotification(businessId, appointmentId);
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

  private async sendNotification(businessId: string, appointmentId: string) {
    const appointment: any = await this.appointmentsRepository.findById(appointmentId);
    if (!appointment) return;

    const { client, service, startTime: time, date, business } = appointment;
    const serviceName = service?.name || "Servico";

    try {
      await this.whatsappService.sendConfirmation(businessId, client.phone, {
        clientName: client.name,
        serviceName,
        date: new Date(date).toLocaleDateString("pt-BR"),
        time,
        businessName: business?.name || "",
      });
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp notification: ${error.message}`);
    }
  }
}
