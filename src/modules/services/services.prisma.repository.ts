import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ServiceEntity } from "./services.entity";
import { ServicesRepository } from "./services.repository";

@Injectable()
export class ServicesPrismaRepository implements ServicesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findManyByUserId(userId: string): Promise<ServiceEntity[]> {
    return this.prisma.service.findMany({ where: { userId } });
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  async create(
    userId: string,
    input: { name: string; duration: number; price: number },
  ): Promise<ServiceEntity> {
    return this.prisma.service.create({
      data: { userId, name: input.name, duration: input.duration, price: input.price },
    });
  }

  async update(
    id: string,
    userId: string,
    input: { name?: string; duration?: number; price?: number },
  ): Promise<ServiceEntity | null> {
    const existing = await this.prisma.service.findFirst({ where: { id, userId } });
    if (!existing) return null;
    return this.prisma.service.update({ where: { id }, data: input });
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.service.findFirst({ where: { id, userId } });
    if (!existing) return;
    await this.prisma.service.delete({ where: { id } });
  }
}
