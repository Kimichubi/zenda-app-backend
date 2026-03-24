import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: { name: string; slug: string }) {
    const existing = await this.prisma.business.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('Slug already in use');

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          ...data,
          ownerId,
          loyaltyConfig: { create: {} },
        },
      });

      await tx.user.update({
        where: { id: ownerId },
        data: { businessId: business.id, role: 'ADMIN' },
      });

      return business;
    });
  }

  async getById(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: { loyaltyConfig: true, staff: true },
    });
  }

  async updateLoyalty(businessId: string, data: { pointsPerReal: number; minRedeemPoints: number; active: boolean }) {
    return this.prisma.loyaltyConfig.update({
      where: { businessId },
      data,
    });
  }
}
