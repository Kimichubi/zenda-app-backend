import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettingsByUserId(userId: string) {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      return this.prisma.siteSettings.create({
        data: { userId },
      });
    }
    return settings;
  }

  async getSettingsBySlug(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      include: {
        siteSettings: true,
        services: true,
        schedules: true,
        ownedBusiness: {
          include: {
            staff: {
              select: { id: true, name: true, role: true },
            },
            products: {
              select: { id: true, name: true, price: true, sku: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Barber not found');
    }

    return {
      barber: {
        id: user.id,
        name: user.name,
        businessName: user.businessName,
        phone: user.phone,
      },
      settings: user.siteSettings,
      services: user.services,
      schedules: user.schedules,
      staff: user.ownedBusiness?.staff ?? [],
      products: user.ownedBusiness?.products ?? [],
    };
  }

  async updateSettings(userId: string, data: Prisma.SiteSettingsUpdateInput) {
    return this.prisma.siteSettings.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        userId,
      } as Prisma.SiteSettingsCreateInput,
    });
  }
}