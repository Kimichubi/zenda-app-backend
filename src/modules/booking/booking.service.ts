import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UsersRepository } from "../users/users.repository";
import { ServicesRepository } from "../services/services.repository";
import { AppointmentsRepository } from "../appointments/appointments.repository";
import { ClientsRepository } from "../clients/clients.repository";
import { SchedulesRepository } from "../schedules/schedules.repository";
import { CreateBookingDto } from "./dto/create-booking.dto";

@Injectable()
export class BookingService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly schedulesRepository: SchedulesRepository,
  ) { }

  async getServices(slug: string) {
    const user = await this.usersRepository.findBySlug(slug);
    if (!user) {
      throw new NotFoundException("Professional not found");
    }
    return this.servicesRepository.findManyByUserId(user.id);
  }

  async getAvailableSlots(slug: string, dateStr: string, serviceId: string) {
    const user = await this.usersRepository.findBySlug(slug);
    if (!user) {
      throw new NotFoundException("Professional not found");
    }

    const service = await this.servicesRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const date = new Date(dateStr);
    const weekday = date.getDay();

    const schedules = await this.schedulesRepository.list(user.id);
    const schedule = schedules.find((s) => s.weekday === weekday);

    if (!schedule) {
      return [];
    }

    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existingAppointments = (
      await this.appointmentsRepository.findByWeek(user.id, dayStart)
    ).filter(
      (a) =>
        a.date >= dayStart &&
        a.date < dayEnd &&
        a.status !== "CANCELLED",
    );

    const bookedTimes = new Set(
      existingAppointments.map((a) => a.startTime).filter(Boolean),
    );

    const slots: { time: string; available: boolean }[] = [];
    for (let m = startMinutes; m + service.duration <= endMinutes; m += 30) {
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      slots.push({ time, available: !bookedTimes.has(time) });
    }

    return slots;
  }

  async createBooking(slug: string, dto: CreateBookingDto) {
    const user = await this.usersRepository.findBySlug(slug);
    if (!user) {
      throw new NotFoundException("Professional not found");
    }

    const service = await this.servicesRepository.findById(dto.serviceId);
    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const date = new Date(dto.date);
    const conflict = await this.appointmentsRepository.findConflict(
      user.id,
      date,
      dto.startTime,
    );
    if (conflict) {
      throw new ConflictException("Time slot is no longer available");
    }

    let client = await this.clientsRepository.findByPhoneAndUserId(
      dto.clientPhone,
      user.id,
    );

    if (!client) {
      client = await this.clientsRepository.create(user.id, {
        name: dto.clientName,
        phone: dto.clientPhone,
        email: dto.clientEmail,
      });
    }

    const [h, m] = dto.startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + service.duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    await this.appointmentsRepository.create(user.id, {
      clientId: client.id,
      serviceId: dto.serviceId,
      date,
      startTime: dto.startTime,
      endTime,
      price: service.price,
    });

    return { message: "Booking created successfully" };
  }
}
