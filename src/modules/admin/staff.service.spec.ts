import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('StaffService', () => {
  let service: StaffService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a professional to a business', async () => {
    const businessId = 'b1';
    const staffData = { name: 'Prof 1', email: 'prof1@test.com', commission: 30 };
    
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'u1', ...staffData });

    const result = await service.addProfessional(businessId, staffData);

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        businessId,
        baseCommission: 30,
        role: 'PROFESSIONAL',
      }),
    }));
    expect(result.id).toBe('u1');
  });
});
