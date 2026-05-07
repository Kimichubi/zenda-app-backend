import { Injectable } from "@nestjs/common";
import { makeId } from "../../infrastructure/database/id.factory";
import {
  AppointmentRecord,
  AppointmentStatus,
  InMemoryDatabaseService,
} from "../../infrastructure/database/in-memory-database.service";
import { AppointmentEntity } from "./appointments.entity";
import { AppointmentsRepository } from "./appointments.repository";

@Injectable()
export class AppointmentsInMemoryRepository implements AppointmentsRepository {
  constructor(private readonly db: InMemoryDatabaseService) { }

  async findManyByBusinessId(businessId: string): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter((a) => a.businessId === businessId);
  }

  async findManyByBusinessIdAndDate(businessId: string, date: Date): Promise<AppointmentEntity[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return this.db.appointments.filter(
      (a) => a.businessId === businessId && a.date >= start && a.date < end,
    );
  }

  async findRangeByBusinessId(businessId: string, start: Date, end: Date): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter(
      (a) => a.businessId === businessId && a.date >= start && a.date < end,
    );
  }

  async findManyByProfessionalId(professionalId: string): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter((a) => a.professionalId === professionalId);
  }

  async findTodayByProfessionalId(professionalId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    return this.db.appointments.filter(
      (a) => a.professionalId === professionalId && a.date >= startOfDay && a.date < endOfDay,
    );
  }

  async findUpcomingByProfessionalId(professionalId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    return this.db.appointments
      .filter((a) => a.professionalId === professionalId && a.date > now && a.status !== "CANCELLED")
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  }

  async findConflict(
    professionalId: string,
    date: Date,
    startTime?: string,
  ): Promise<AppointmentEntity | null> {
    return (
      this.db.appointments.find(
        (a) =>
          a.professionalId === professionalId &&
          a.date.toISOString() === date.toISOString() &&
          a.status !== "CANCELLED" &&
          (!startTime || a.startTime === startTime),
      ) ?? null
    );
  }

  async findByWeek(professionalId: string, startDate: Date): Promise<AppointmentEntity[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return this.db.appointments.filter((a) => {
      if (a.professionalId !== professionalId) return false;
      return a.date >= start && a.date < end;
    });
  }

  async findByClientId(clientId: string): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter((a) => a.clientId === clientId);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    return this.db.appointments.find((a) => a.id === id) ?? null;
  }

  async create(input: {
    businessId: string;
    professionalId: string;
    clientId: string;
    serviceId?: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    price?: number;
  }): Promise<AppointmentEntity> {
    const record: AppointmentRecord = {
      id: makeId(),
      businessId: input.businessId,
      professionalId: input.professionalId,
      clientId: input.clientId,
      serviceId: input.serviceId ?? null,
      date: input.date,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      price: input.price ?? null,
      status: "SCHEDULED",
      createdAt: new Date(),
    };
    this.db.appointments.push(record);
    return record;
  }

  async update(
    id: string,
    businessId: string,
    input: {
      status?: AppointmentStatus;
      clientId?: string;
      serviceId?: string;
      date?: string | Date;
      startTime?: string;
      endTime?: string;
      price?: number;
    },
  ): Promise<AppointmentEntity | null> {
    const idx = this.db.appointments.findIndex(
      (a) => a.id === id && a.businessId === businessId,
    );
    if (idx < 0) return null;

    const { date, serviceId, clientId, ...rest } = input;

    this.db.appointments[idx] = {
      ...this.db.appointments[idx],
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(serviceId !== undefined ? { serviceId: serviceId ?? null } : {}),
    };

    return this.db.appointments[idx];
  }
}
