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

  async findManyByUserId(userId: string): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter((a) => a.userId === userId);
  }

  async findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return this.db.appointments.filter((a) => {
      if (a.userId !== userId) return false;
      return a.date >= start && a.date < end;
    });
  }

  async findConflict(
    userId: string,
    date: Date,
    startTime?: string,
  ): Promise<AppointmentEntity | null> {
    return (
      this.db.appointments.find(
        (a) =>
          a.userId === userId &&
          a.date.toISOString() === date.toISOString() &&
          a.status !== "CANCELLED" &&
          (!startTime || a.startTime === startTime),
      ) ?? null
    );
  }

  async findByClientId(clientId: string): Promise<AppointmentEntity[]> {
    return this.db.appointments.filter((a) => a.clientId === clientId);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    return this.db.appointments.find((a) => a.id === id) ?? null;
  }

  async findTodayByUserId(userId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.db.appointments.filter(
      (a) => a.userId === userId && a.date >= startOfDay && a.date < endOfDay,
    );
  }

  async findUpcomingByUserId(userId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    return this.db.appointments
      .filter((a) => a.userId === userId && a.date > now && a.status !== "CANCELLED")
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  }

  async create(
    userId: string,
    input: {
      clientId: string;
      serviceId?: string;
      date: Date;
      startTime?: string;
      endTime?: string;
      price?: number;
    },
  ): Promise<AppointmentEntity> {
    const record: AppointmentRecord = {
      id: makeId(),
      userId,
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

  async updateStatus(
    id: string,
    userId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentEntity | null> {
    const idx = this.db.appointments.findIndex(
      (a) => a.id === id && a.userId === userId,
    );
    if (idx < 0) return null;

    this.db.appointments[idx].status = status;
    return this.db.appointments[idx];
  }
}
