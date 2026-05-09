import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ServicesRepository } from "../services/services.repository";
import { AppointmentsRepository } from "../appointments/appointments.repository";
import { ClientsRepository } from "../clients/clients.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { CreateBookingDto } from "./dto/create-booking.dto";

@Injectable()
export class BookingService {
  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly prisma: PrismaService,
  ) { }

  private async findBusinessBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        services: true,
      },
    });
    if (!business) {
      throw new NotFoundException("Business not found");
    }
    return business;
  }

  async getServices(slug: string) {
    const business = await this.findBusinessBySlug(slug);
    const result = await this.servicesRepository.findManyByBusinessId(business.id);
    return result.data;
  }

  async getAvailableSlots(slug: string, dateStr: string, serviceId: string, professionalId?: string) {
    const business = await this.findBusinessBySlug(slug);

    const service = await this.servicesRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Service not found");
    }

    // Use first staff member if not specified
    const profId = professionalId || (business.staff.length > 0 ? business.staff[0].id : null);
    if (!profId) {
      return [];
    }

    const date = new Date(dateStr);
    const weekday = date.getDay();

    const schedule = await this.prisma.schedule.findUnique({
      where: {
        businessId_professionalId_weekday: {
          businessId: business.id,
          professionalId: profId,
          weekday,
        },
      },
    });

    // Check for date-specific override
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const override = await this.prisma.professionalScheduleOverride.findFirst({
      where: {
        professionalId: profId,
        date: { gte: dayStart, lt: dayEnd },
      },
    });

    if (override && !override.isAvailable) {
      return [];
    }

    const effectiveSchedule = override
      ? {
          ...schedule,
          startTime: override.startTime ?? schedule?.startTime ?? "09:00",
          endTime: override.endTime ?? schedule?.endTime ?? "18:00",
          breakStart: override.breakStart ?? schedule?.breakStart,
          breakEnd: override.breakEnd ?? schedule?.breakEnd,
          isActive: schedule?.isActive ?? true,
          slotDuration: schedule?.slotDuration ?? 30,
        }
      : schedule;

    if (!effectiveSchedule) {
      return [];
    }

    const existingAppointments = (
      await this.appointmentsRepository.findByWeek(profId, dayStart)
    ).filter(
      (a) =>
        a.date >= dayStart &&
        a.date < dayEnd &&
        a.status !== "CANCELLED" &&
        a.status !== "NO_SHOW",
    );

    const blockedSlots = await this.prisma.blockedSlot.findMany({
      where: {
        professionalId: profId,
        date: { gte: dayStart, lt: dayEnd },
      },
    });

    const [startH, startM] = effectiveSchedule.startTime.split(":").map(Number);
    const [endH, endM] = effectiveSchedule.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const slotDuration = effectiveSchedule.slotDuration || 30;

    const breakStartMinutes = effectiveSchedule.breakStart
      ? effectiveSchedule.breakStart.split(":").map(Number).reduce((h, m) => h * 60 + m, 0)
      : null;
    const breakEndMinutes = effectiveSchedule.breakEnd
      ? effectiveSchedule.breakEnd.split(":").map(Number).reduce((h, m) => h * 60 + m, 0)
      : null;

    const bookedRanges = existingAppointments.map((a) => {
      const [h, m] = (a.startTime ?? "00:00").split(":").map(Number);
      const start = h * 60 + m;
      const [eh, em] = (a.endTime ?? "00:00").split(":").map(Number);
      const end = eh * 60 + em;
      return { start, end };
    });

    const blockedRanges = blockedSlots.map((b) => {
      const [h, m] = b.startTime.split(":").map(Number);
      const start = h * 60 + m;
      const [eh, em] = b.endTime.split(":").map(Number);
      const end = eh * 60 + em;
      return { start, end };
    });

    const now = new Date();
    const isToday = dayStart.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    const slots: { time: string; available: boolean }[] = [];
    for (let m = startMinutes; m + service.duration <= endMinutes; m += slotDuration) {
      const slotEnd = m + service.duration;
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

      const isPast = isToday && m <= currentMinutes;
      const isBooked = bookedRanges.some((b) => m < b.end && slotEnd > b.start);
      const isBlocked = blockedRanges.some((b) => m < b.end && slotEnd > b.start);
      const isBreak = breakStartMinutes !== null && breakEndMinutes !== null &&
        m < breakEndMinutes && slotEnd > breakStartMinutes;

      slots.push({
        time,
        available: !isPast && !isBooked && !isBlocked && !isBreak,
      });
    }

    return slots;
  }

  async createBooking(slug: string, dto: CreateBookingDto) {
    const business = await this.findBusinessBySlug(slug);

    const service = await this.servicesRepository.findById(dto.serviceId);
    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const profId = dto.professionalId || (business.staff.length > 0 ? business.staff[0].id : null);
    if (!profId) {
      throw new NotFoundException("No professional available");
    }

    const date = new Date(dto.date);
    const conflict = await this.appointmentsRepository.findConflict(
      profId,
      date,
      dto.startTime,
    );
    if (conflict) {
      throw new ConflictException("Time slot is no longer available");
    }

    let client = await this.clientsRepository.findByPhoneAndBusinessId(
      dto.clientPhone,
      business.id,
    );

    if (!client) {
      client = await this.clientsRepository.create(business.id, {
        name: dto.clientName,
        phone: dto.clientPhone,
        email: dto.clientEmail,
      });
    }

    // Check for professional-specific pricing/duration
    const serviceProfessional = await this.prisma.serviceProfessional.findUnique({
      where: {
        serviceId_professionalId: {
          serviceId: dto.serviceId,
          professionalId: profId,
        },
      },
    });

    const effectivePrice = serviceProfessional?.customPrice ?? service.price;
    const effectiveDuration = serviceProfessional?.customDuration ?? service.duration;

    const [h, m] = dto.startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + effectiveDuration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    await this.appointmentsRepository.create({
      businessId: business.id,
      professionalId: profId,
      clientId: client.id,
      serviceId: dto.serviceId,
      date,
      startTime: dto.startTime,
      endTime,
      price: effectivePrice,
    });

    return { message: "Booking created successfully" };
  }
}
