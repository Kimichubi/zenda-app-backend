import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ServiceEntity } from "./services.entity";
import { ServicesRepository } from "./services.repository";
import { FindServicesDto } from "./dto/find-services.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ServicesPrismaRepository implements ServicesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findManyByBusinessId(
    businessId: string,
    query: FindServicesDto = {},
  ): Promise<{ data: ServiceEntity[]; total: number }> {
    const { search, minPrice, maxPrice, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      businessId,
      AND: [
        search
          ? { name: { contains: search, mode: "insensitive" } }
          : {},
        minPrice ? { price: { gte: minPrice } } : {},
        maxPrice ? { price: { lte: maxPrice } } : {},
      ],
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<ServiceEntity | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  async create(
    businessId: string,
    input: { name: string; duration: number; price: number },
  ): Promise<ServiceEntity> {
    return this.prisma.service.create({
      data: { businessId, name: input.name, duration: input.duration, price: input.price },
    });
  }

  async update(
    id: string,
    businessId: string,
    input: { name?: string; duration?: number; price?: number },
  ): Promise<ServiceEntity | null> {
    const existing = await this.prisma.service.findFirst({ where: { id, businessId } });
    if (!existing) return null;
    return this.prisma.service.update({ where: { id }, data: input });
  }

  async delete(id: string, businessId: string): Promise<void> {
    const existing = await this.prisma.service.findFirst({ where: { id, businessId } });
    if (!existing) return;
    await this.prisma.service.delete({ where: { id } });
  }
}
