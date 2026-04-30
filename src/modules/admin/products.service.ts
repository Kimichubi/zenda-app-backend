import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateProductDto } from './dto/pos.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        businessId,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId },
    });
  }

  async update(id: string, businessId: string, dto: Partial<CreateProductDto>) {
    const product = await this.prisma.product.findFirst({ where: { id, businessId } });
    if (!product) throw new NotFoundException();

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, businessId: string) {
    return this.prisma.product.deleteMany({
      where: { id, businessId },
    });
  }
}
