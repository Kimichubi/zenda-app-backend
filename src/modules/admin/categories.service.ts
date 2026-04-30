import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, data: { name: string }) {
    return this.prisma.category.create({
      data: { ...data, businessId },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.category.findMany({
      where: { businessId },
    });
  }

  async update(id: string, businessId: string, data: { name: string }) {
    const category = await this.prisma.category.findFirst({ where: { id, businessId } });
    if (!category) throw new BadRequestException('Category not found');

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, businessId: string) {
    return this.prisma.category.deleteMany({
      where: { id, businessId },
    });
  }
}