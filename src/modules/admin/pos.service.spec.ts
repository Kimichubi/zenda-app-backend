import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('PosService', () => {
  let service: PosService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
    },
    inventoryMovement: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should process a checkout correctly', async () => {
    const businessId = 'b1';
    const sellerId = 'u1';
    const checkoutData = {
      items: [{ productId: 'p1', quantity: 2 }],
      paymentMethod: 'PIX',
    };

    mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', name: 'Prod 1', price: 50, stock: 10 });
    mockPrisma.sale.create.mockResolvedValue({ id: 's1', totalAmount: 100 });

    const result = await service.checkout(businessId, sellerId, checkoutData);

    expect(mockPrisma.product.update).toHaveBeenCalled();
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'OUT' }),
    }));
    expect(result.id).toBe('s1');
  });

  it('should throw error if product is out of stock', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', stock: 1 });
    
    await expect(service.checkout('b1', 'u1', {
      items: [{ productId: 'p1', quantity: 5 }],
      paymentMethod: 'CASH'
    })).rejects.toThrow(BadRequestException);
  });
});
