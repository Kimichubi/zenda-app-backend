import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettingsByBusinessId(businessId: string) {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { businessId },
    });
    if (!settings) {
      return this.prisma.siteSettings.create({
        data: { businessId },
      });
    }
    return settings;
  }

  async getSettingsBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        siteSettings: true,
        services: true,
        schedules: {
          include: { professional: { select: { id: true, name: true, role: true } } },
        },
        staff: {
          select: { id: true, name: true, role: true },
        },
        products: {
          select: { id: true, name: true, price: true, sku: true },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      settings: business.siteSettings,
      services: business.services,
      schedules: business.schedules,
      staff: business.staff,
      products: business.products,
    };
  }

  async updateSettings(businessId: string, data: Prisma.SiteSettingsUpdateInput) {
    return this.prisma.siteSettings.upsert({
      where: { businessId },
      update: data,
      create: {
        ...data,
        businessId,
      } as Prisma.SiteSettingsCreateInput,
    });
  }
}
