import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { SchedulesRepository } from "./schedules.repository";
import { ServicesRepository } from "../services/services.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ScheduleEntity, BlockedSlotEntity, TimeSlot, AvailabilityResult } from "./schedules.entity";

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly servicesRepository: ServicesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getAvailability(professionalId: string, date: string, serviceId?: string): Promise<AvailabilityResult> {
    const targetDate = new Date(date);
    const weekday = targetDate.getDay();
    const schedule = await this.schedulesRepository.findByProfessionalAndWeekday(professionalId, weekday);

    if (!schedule || !schedule.isActive) {
      return { date, professionalId, slots: [] };
    }

    const blockedSlots = await this.getBlockedSlots(professionalId, targetDate);
    const appointments = await this.getAppointments(professionalId, targetDate);

    let serviceDuration = 30;
    if (serviceId) {
      const service = await this.servicesRepository.findById(serviceId);
      if (service) {
        serviceDuration = service.duration;
      }
    }

    const slots = this.generateSlots(schedule, blockedSlots, appointments, serviceDuration);
    return { date, professionalId, slots };
  }

  async checkSlotAvailable(
    professionalId: string,
    date: string,
    startTime: string,
    serviceId?: string,
  ): Promise<{ available: boolean; reason?: string }> {
    const targetDate = new Date(date);
    const weekday = targetDate.getDay();
    const schedule = await this.schedulesRepository.findByProfessionalAndWeekday(professionalId, weekday);

    if (!schedule || !schedule.isActive) {
      return { available: false, reason: "Professional not working on this day" };
    }

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + (serviceId ? await this.getServiceDuration(serviceId) : 30);

    if (startMinutes < this.timeToMinutes(schedule.startTime) || endMinutes > this.timeToMinutes(schedule.endTime)) {
      return { available: false, reason: "Outside working hours" };
    }

    if (schedule.breakStart && schedule.breakEnd) {
      const breakStart = this.timeToMinutes(schedule.breakStart);
      const breakEnd = this.timeToMinutes(schedule.breakEnd);
      if (!(endMinutes <= breakStart || startMinutes >= breakEnd)) {
        return { available: false, reason: "Conflicts with break time" };
      }
    }

    const conflicting = await this.findConflictingAppointment(professionalId, targetDate, startTime, endMinutes);
    if (conflicting) {
      return { available: false, reason: "Slot already booked" };
    }

    const blockedConflict = await this.findConflictingBlockedSlot(professionalId, targetDate, startMinutes, endMinutes);
    if (blockedConflict) {
      return { available: false, reason: `Blocked: ${blockedConflict.reason}` };
    }

    return { available: true };
  }

  async validateBooking(
    professionalId: string,
    date: string,
    startTime: string,
    serviceId?: string,
    excludeAppointmentId?: string,
  ): Promise<void> {
    const result = await this.checkSlotAvailable(professionalId, date, startTime, serviceId);
    if (!result.available) {
      throw new ConflictException(result.reason);
    }
  }

  private async getServiceDuration(serviceId: string): Promise<number> {
    const service = await this.servicesRepository.findById(serviceId);
    return service?.duration ?? 30;
  }

  private async getBlockedSlots(professionalId: string, date: Date): Promise<BlockedSlotEntity[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.prisma.blockedSlot.findMany({
      where: {
        professionalId,
        date: { gte: startOfDay, lt: endOfDay },
      },
    }) as any;
  }

  private async getAppointments(professionalId: string, date: Date): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        professionalId,
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: "CANCELLED" },
      },
    });
  }

  private async findConflictingAppointment(
    professionalId: string,
    date: Date,
    startTime: string,
    endMinutes: number,
  ): Promise<any | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        date: { gte: startOfDay, lt: endOfDay },
        status: { not: "CANCELLED" },
      },
    });

    const requestedStart = this.timeToMinutes(startTime);

    for (const apt of appointments) {
      if (!apt.startTime || !apt.endTime) continue;

      const aptStart = this.timeToMinutes(apt.startTime);
      const aptEnd = this.timeToMinutes(apt.endTime);

      if (requestedStart < aptEnd && endMinutes > aptStart) {
        return apt;
      }
    }

    return null;
  }

  private async findConflictingBlockedSlot(
    professionalId: string,
    date: Date,
    startMinutes: number,
    endMinutes: number,
  ): Promise<BlockedSlotEntity | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const blockedSlots = await this.prisma.blockedSlot.findMany({
      where: {
        professionalId,
        date: { gte: startOfDay, lt: endOfDay },
      },
    });

    for (const slot of blockedSlots) {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      if (startMinutes < slotEnd && endMinutes > slotStart) {
        return slot;
      }
    }

    return null;
  }

  private generateSlots(
    schedule: ScheduleEntity,
    blockedSlots: BlockedSlotEntity[],
    appointments: any[],
    serviceDuration: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const slotDuration = schedule.slotDuration || 30;

    let current = this.timeToMinutes(schedule.startTime);
    const end = this.timeToMinutes(schedule.endTime);
    const breakStart = schedule.breakStart ? this.timeToMinutes(schedule.breakStart) : null;
    const breakEnd = schedule.breakEnd ? this.timeToMinutes(schedule.breakEnd) : null;

    while (current + serviceDuration <= end) {
      const slotEnd = current + serviceDuration;

      let available = true;
      let reason: string | undefined;

      if (breakStart !== null && breakEnd !== null) {
        if (!(slotEnd <= breakStart || current >= breakEnd)) {
          available = false;
          reason = "Break time";
        }
      }

      if (available) {
        const conflicting = appointments.find((apt) => {
          if (!apt.startTime || !apt.endTime) return false;
          const aptStart = this.timeToMinutes(apt.startTime);
          const aptEnd = this.timeToMinutes(apt.endTime);
          return current < aptEnd && slotEnd > aptStart;
        });
        if (conflicting) {
          available = false;
          reason = "Already booked";
        }
      }

      if (available) {
        const conflictingBlocked = blockedSlots.find((bs) => {
          const bsStart = this.timeToMinutes(bs.startTime);
          const bsEnd = this.timeToMinutes(bs.endTime);
          return current < bsEnd && slotEnd > bsStart;
        });
        if (conflictingBlocked) {
          available = false;
          reason = `Blocked: ${conflictingBlocked.reason}`;
        }
      }

      slots.push({
        time: this.minutesToTime(current),
        available,
        reason,
      });

      current += slotDuration;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
}