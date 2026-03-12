import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { AppointmentEntity } from "./appointments.entity";
import { AppointmentsRepository } from "./appointments.repository";
import { AppointmentStatus } from "../../infrastructure/database/in-memory-database.service";

@Injectable()
export class AppointmentsPrismaRepository implements AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findManyByUserId(userId: string): Promise<AppointmentEntity[]> {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
  }

  async findConflict(
    userId: string,
    date: Date,
    startTime?: string,
  ): Promise<AppointmentEntity | null> {
    return this.prisma.appointment.findFirst({
      where: {
        userId,
        date,
        ...(startTime ? { startTime } : {}),
        NOT: { status: "CANCELLED" },
      },
    });
  }

  async findByWeek(userId: string, startDate: Date): Promise<AppointmentEntity[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return this.prisma.appointment.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
      },
      orderBy: { date: "asc" },
    });
  }

  async findByClientId(clientId: string): Promise<AppointmentEntity[]> {
    return this.prisma.appointment.findMany({
      where: { clientId },
      orderBy: { date: "desc" },
    });
  }

  async findTodayByUserId(userId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: { userId, date: { gte: startOfDay, lt: endOfDay } },
      orderBy: { date: "asc" },
    });
  }

  async findUpcomingByUserId(userId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        userId,
        date: { gt: now },
        NOT: { status: "CANCELLED" },
      },
      orderBy: { date: "asc" },
      take: 10,
    });
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
    return this.prisma.appointment.create({
      data: {
        userId,
        clientId: input.clientId,
        serviceId: input.serviceId ?? null,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        price: input.price ?? null,
        status: "SCHEDULED",
      },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentEntity | null> {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }
}
