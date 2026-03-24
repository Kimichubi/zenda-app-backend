import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('CommissionService', () => {
  let service: CommissionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findUnique: jest.fn(),
            },
            commission: {
              create: jest.fn(),
              findMany: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should calculate and create commission for an appointment', async () => {
    const appointmentId = 'a1';
    const mockAppointment = {
      id: 'a1',
      price: 100,
      user: { id: 'u1', baseCommission: 30 },
    };

    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
    (prisma.commission.create as jest.Mock).mockResolvedValue({ id: 'c1', amount: 30 });

    const result = await service.calculateForAppointment(appointmentId);

    expect(prisma.commission.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amount: 30,
        percentage: 30,
      }),
    }));
    expect(result.amount).toBe(30);
  });
});
