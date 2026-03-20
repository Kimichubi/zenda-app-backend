import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from '../../infrastructure/notifications/whatsapp.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  let whatsappService: WhatsappService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockWhatsappService = {
      getSessionStatus: jest.fn(),
      startSession: jest.fn(),
      getQRCode: jest.fn(),
      logoutSession: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [
        {
          provide: WhatsappService,
          useValue: mockWhatsappService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
    whatsappService = module.get<WhatsappService>(WhatsappService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return status and update user', async () => {
      const req = { user: { id: 'user-1' } };
      const status = 'CONNECTED';
      jest.spyOn(whatsappService, 'getSessionStatus').mockResolvedValue(status);

      const result = await controller.getStatus(req);

      expect(whatsappService.getSessionStatus).toHaveBeenCalledWith('user-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { whatsappStatus: status } as any,
      });
      expect(result).toEqual({ status });
    });
  });

  describe('connect', () => {
    it('should call startSession', async () => {
      const req = { user: { id: 'user-1' } };
      const expected = { success: true };
      jest.spyOn(whatsappService, 'startSession').mockResolvedValue(expected as any);

      const result = await controller.connect(req);

      expect(whatsappService.startSession).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expected);
    });
  });

  describe('getQR', () => {
    it('should call getQRCode and return qr', async () => {
      const req = { user: { id: 'user-1' } };
      const qrCode = 'data:image/png;base64,mockqr';
      jest.spyOn(whatsappService, 'getQRCode').mockResolvedValue(qrCode);

      const result = await controller.getQR(req);

      expect(whatsappService.getQRCode).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ qr: qrCode });
    });
  });

  describe('logout', () => {
    it('should logout and update user if success', async () => {
      const req = { user: { id: 'user-1' } };
      const logoutResult = { success: true };
      jest.spyOn(whatsappService, 'logoutSession').mockResolvedValue(logoutResult);

      const result = await controller.logout(req);

      expect(whatsappService.logoutSession).toHaveBeenCalledWith('user-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { whatsappStatus: 'DISCONNECTED' } as any,
      });
      expect(result).toBe(logoutResult);
    });

    it('should logout and NOT update user if failure', async () => {
      const req = { user: { id: 'user-1' } };
      const logoutResult = { success: false };
      jest.spyOn(whatsappService, 'logoutSession').mockResolvedValue(logoutResult);

      const result = await controller.logout(req);

      expect(whatsappService.logoutSession).toHaveBeenCalledWith('user-1');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result).toBe(logoutResult);
    });
  });
});