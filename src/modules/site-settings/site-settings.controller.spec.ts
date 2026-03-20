import { Test, TestingModule } from '@nestjs/testing';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';
import { Prisma } from '@prisma/client';

describe('SiteSettingsController', () => {
  let controller: SiteSettingsController;
  let service: SiteSettingsService;

  beforeEach(async () => {
    const mockSiteSettingsService = {
      getSettingsBySlug: jest.fn(),
      getSettingsByUserId: jest.fn(),
      updateSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteSettingsController],
      providers: [
        {
          provide: SiteSettingsService,
          useValue: mockSiteSettingsService,
        },
      ],
    }).compile();

    controller = module.get<SiteSettingsController>(SiteSettingsController);
    service = module.get<SiteSettingsService>(SiteSettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPublicSettings', () => {
    it('should call getSettingsBySlug', async () => {
      const slug = 'test-slug';
      const expected = { settings: true };
      jest.spyOn(service, 'getSettingsBySlug').mockResolvedValue(expected as any);

      const result = await controller.getPublicSettings(slug);

      expect(service.getSettingsBySlug).toHaveBeenCalledWith(slug);
      expect(result).toBe(expected);
    });
  });

  describe('getSettings', () => {
    it('should call getSettingsByUserId', async () => {
      const req = { user: { id: 'user-1' } };
      const expected = { settings: true };
      jest.spyOn(service, 'getSettingsByUserId').mockResolvedValue(expected as any);

      const result = await controller.getSettings(req);

      expect(service.getSettingsByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expected);
    });
  });

  describe('updateSettings', () => {
    it('should call updateSettings', async () => {
      const req = { user: { id: 'user-1' } };
      const data: Prisma.SiteSettingsUpdateInput = { theme: 'dark' };
      const expected = { theme: 'dark' };
      jest.spyOn(service, 'updateSettings').mockResolvedValue(expected as any);

      const result = await controller.updateSettings(req, data);

      expect(service.updateSettings).toHaveBeenCalledWith('user-1', data);
      expect(result).toBe(expected);
    });
  });
});