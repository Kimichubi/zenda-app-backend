import { Test, TestingModule } from '@nestjs/testing';
import { SiteSettingsService } from './site-settings.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      siteSettings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteSettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SiteSettingsService>(SiteSettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettingsByUserId', () => {
    it('should return existing settings', async () => {
      const settings = { id: '1', userId: 'user-1' };
      jest.spyOn(prisma.siteSettings, 'findUnique').mockResolvedValue(settings as any);

      const result = await service.getSettingsByUserId('user-1');

      expect(prisma.siteSettings.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(result).toBe(settings);
    });

    it('should create and return new settings if not found', async () => {
      const newSettings = { id: '2', userId: 'user-1' };
      jest.spyOn(prisma.siteSettings, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.siteSettings, 'create').mockResolvedValue(newSettings as any);

      const result = await service.getSettingsByUserId('user-1');

      expect(prisma.siteSettings.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
      expect(result).toBe(newSettings);
    });
  });

  describe('getSettingsBySlug', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getSettingsBySlug('invalid-slug')).rejects.toThrow(NotFoundException);
    });

    it('should return combined settings data if user found', async () => {
      const user = {
        id: 'user-1',
        name: 'John Doe',
        businessName: 'Barber Shop',
        phone: '123456789',
        siteSettings: { theme: 'light' },
        services: [{ id: 's1' }],
        schedules: [{ id: 'sch1' }],
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user as any);

      const result = await service.getSettingsBySlug('valid-slug');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { slug: 'valid-slug' },
        include: {
          siteSettings: true,
          services: true,
          schedules: true,
        },
      });

      expect(result).toEqual({
        barber: {
          id: user.id,
          name: user.name,
          businessName: user.businessName,
          phone: user.phone,
        },
        settings: user.siteSettings,
        services: user.services,
        schedules: user.schedules,
      });
    });
  });

  describe('updateSettings', () => {
    it('should call upsert with correct data', async () => {
      const userId = 'user-1';
      const data: Prisma.SiteSettingsUpdateInput = { theme: 'dark' };
      const expected = { id: '1', userId, theme: 'dark' };
      jest.spyOn(prisma.siteSettings, 'upsert').mockResolvedValue(expected as any);

      const result = await service.updateSettings(userId, data);

      expect(prisma.siteSettings.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: data,
        create: { ...data, userId } as Prisma.SiteSettingsCreateInput,
      });
      expect(result).toBe(expected);
    });
  });
});