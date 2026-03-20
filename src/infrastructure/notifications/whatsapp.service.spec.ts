import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsappService } from './whatsapp.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsappService', () => {
  let service: WhatsappService;
  let configService: ConfigService;

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
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    configService = module.get<ConfigService>(ConfigService);
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
    it('should return base64 encoded QR code', async () => {
      const mockBuffer = Buffer.from('qr-code-data');
      mockedAxios.get.mockResolvedValueOnce({
        data: mockBuffer,
        status: 200,
      });

      const result = await service.getQRCode('test-user');
      expect(result).toBe(mockBuffer.toString('base64'));
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
});
