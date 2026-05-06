import { Injectable, BadRequestException } from "@nestjs/common";
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
      include: {
        client: true,
        service: true,
      }
    }) as any;
  }

  async findManyByUserIdAndDate(userId: string, date: Date): Promise<AppointmentEntity[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return this.prisma.appointment.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { client: true, service: true },
      orderBy: { date: "asc" },
    }) as any;
  }

  async findRangeByUserId(userId: string, start: Date, end: Date): Promise<AppointmentEntity[]> {
    return this.prisma.appointment.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { client: true, service: true },
      orderBy: { date: "asc" },
    }) as any;
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
    }) as any;
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
      include: {
        client: true,
        service: true,
      },
      orderBy: { date: "asc" },
    }) as any;
  }

  async findByClientId(clientId: string): Promise<AppointmentEntity[]> {
    return this.prisma.appointment.findMany({
      where: { clientId },
      orderBy: { date: "desc" },
    }) as any;
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
        user: true,
      }
    }) as any;
  }

  async findTodayByUserId(userId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: { userId, date: { gte: startOfDay, lt: endOfDay } },
      include: {
        client: true,
        service: true,
      },
      orderBy: { date: "asc" },
    }) as any;
  }

  async findUpcomingByUserId(userId: string): Promise<AppointmentEntity[]> {
    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        userId,
        date: { gt: now },
        NOT: { status: "CANCELLED" },
      },
      include: {
        client: true,
        service: true,
      },
      orderBy: { date: "asc" },
      take: 10,
    }) as any;
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
    if (!userId) throw new BadRequestException("userId is required to create an appointment");
    return this.prisma.appointment.create({
      data: {
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        price: input.price ?? null,
        status: "SCHEDULED",
        user: { connect: { id: userId } },
        client: { connect: { id: input.clientId } },
        ...(input.serviceId ? { service: { connect: { id: input.serviceId } } } : {}),
      },
      include: {
        client: true,
        service: true,
      }
    }) as any;
  }

  async update(
    id: string,
    userId: string,
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
    const existing = await this.prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const { status, clientId, serviceId, date, startTime, endTime, price } = input;

    return (await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(clientId ? { client: { connect: { id: clientId } } } : {}),
        ...(serviceId ? { service: { connect: { id: serviceId } } } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        ...(price !== undefined ? { price } : {}),
      },
      include: {
        client: true,
        service: true,
      },
    })) as any;
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
      include: {
        client: true,
        service: true,
      }
    }) as any;
  }
}