import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../database/prisma.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsappService', () => {
  let service: WhatsappService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WHATSAPP_BASE_URL') return 'http://localhost:3001';
              if (key === 'WAHA_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('should call axios.post with the correct payload', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });
      const userId = 'test-user-id';

      await service.startSession(userId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions',
        {
          name: 'default',
          config: {
            proxy: null,
            noweb: {},
          },
        },
        expect.any(Object)
      );
    });

    it('should attempt to start the session if it already exists (422 error)', async () => {
      mockedAxios.post
        .mockRejectedValueOnce({
          response: {
            status: 422,
            data: { message: "Session 'default' already exists" }
          }
        })
        .mockResolvedValueOnce({ data: {} }); // Second call to /start

      const userId = 'test-user-id';
      await service.startSession(userId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions',
        expect.any(Object),
        expect.any(Object)
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions/default/start',
        {},
        expect.any(Object)
      );
    });
  });

  describe('getSessionStatus', () => {
    it('should return session status', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'WORKING' } });
      const status = await service.getSessionStatus('test-user');
      expect(status).toBe('WORKING');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions/default',
        expect.any(Object)
      );
    });

    it('should return NOT_FOUND on error', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });
      const status = await service.getSessionStatus('test-user');
      expect(status).toBe('NOT_FOUND');
    });
  });

  describe('getQRCode', () => {
    it('should return base64 encoded QR code from JSON response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          mimetype: 'image/png',
          data: 'base64-qr-data'
        },
        status: 200,
      });

      const result = await service.getQRCode('test-user');
      expect(result).toBe('base64-qr-data');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/default/auth/qr',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('error'));
      const result = await service.getQRCode('test-user');
      expect(result).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should call api/sendText with formatted phone and text', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'msg-id' } });
      await service.sendMessage('test-user', '11999999999', 'Hello');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/sendText',
        {
          chatId: '5511999999999@c.us',
          text: 'Hello',
          session: 'default',
        },
        expect.any(Object)
      );
    });
  });

  describe('multi-account session names', () => {
    it('should use biz-prefixed session name when user has a business', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce({ businessId: 'biz-123' });
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'WORKING' } });

      const status = await service.getSessionStatus('user-with-business');

      expect(status).toBe('WORKING');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions/biz-biz-123',
        expect.any(Object)
      );
    });

    it('should fallback to default session when user has no business', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'SCANNING' } });

      const status = await service.getSessionStatus('user-no-business');

      expect(status).toBe('SCANNING');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions/default',
        expect.any(Object)
      );
    });
  });

  describe('logoutSession', () => {
    it('should call logout and delete on the correct session', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });
      mockedAxios.delete.mockResolvedValueOnce({ data: {} });

      const result = await service.logoutSession('test-user');

      expect(result).toEqual({ success: true });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions/default/logout',
        {},
        expect.any(Object)
      );
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions/default',
        expect.any(Object)
      );
    });
  });
});
