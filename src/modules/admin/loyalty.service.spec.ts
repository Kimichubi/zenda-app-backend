import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: PrismaService,
          useValue: {
            sale: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            client: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should add points to client after a sale', async () => {
    const mockSale = {
      id: 's1',
      totalAmount: 100,
      customerId: 'c1',
      business: {
        loyaltyConfig: { active: true, pointsPerReal: 1 }
      }
    };

    (prisma.sale.findUnique as jest.Mock).mockResolvedValue(mockSale);
    
    await service.processSalePoints('s1');

    expect(prisma.client.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'c1' },
      data: { pointsBalance: { increment: 100 } }
    }));
  });
});
