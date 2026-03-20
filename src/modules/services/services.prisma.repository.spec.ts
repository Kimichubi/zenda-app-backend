import { Test, TestingModule } from '@nestjs/testing';
import { ServicesPrismaRepository } from './services.prisma.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('ServicesPrismaRepository', () => {
  let repository: ServicesPrismaRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesPrismaRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ServicesPrismaRepository>(ServicesPrismaRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findManyByUserId', () => {
    it('should call prisma.service.findMany', async () => {
      const expected = [{ id: '1' }];
      jest.spyOn(prisma.service, 'findMany').mockResolvedValue(expected as any);
      const result = await repository.findManyByUserId('user-1');
      expect(prisma.service.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(result).toBe(expected);
    });
  });

  describe('findById', () => {
    it('should call prisma.service.findUnique', async () => {
      const expected = { id: '1' };
      jest.spyOn(prisma.service, 'findUnique').mockResolvedValue(expected as any);
      const result = await repository.findById('1');
      expect(prisma.service.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBe(expected);
    });
  });

  describe('create', () => {
    it('should call prisma.service.create', async () => {
      const input = { name: 'Test', duration: 30, price: 100 };
      const expected = { id: '1', userId: 'user-1', ...input };
      jest.spyOn(prisma.service, 'create').mockResolvedValue(expected as any);
      const result = await repository.create('user-1', input);
      expect(prisma.service.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: 'Test', duration: 30, price: 100 }
      });
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should return null if service not found', async () => {
      jest.spyOn(prisma.service, 'findFirst').mockResolvedValue(null);
      const result = await repository.update('1', 'user-1', { name: 'Updated' });
      expect(prisma.service.findFirst).toHaveBeenCalledWith({ where: { id: '1', userId: 'user-1' } });
      expect(result).toBeNull();
    });

    it('should call prisma.service.update if service found', async () => {
      const existing = { id: '1', userId: 'user-1' };
      const expected = { ...existing, name: 'Updated' };
      jest.spyOn(prisma.service, 'findFirst').mockResolvedValue(existing as any);
      jest.spyOn(prisma.service, 'update').mockResolvedValue(expected as any);
      
      const result = await repository.update('1', 'user-1', { name: 'Updated' });
      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' }
      });
      expect(result).toBe(expected);
    });
  });

  describe('delete', () => {
    it('should return early if service not found', async () => {
      jest.spyOn(prisma.service, 'findFirst').mockResolvedValue(null);
      await repository.delete('1', 'user-1');
      expect(prisma.service.delete).not.toHaveBeenCalled();
    });

    it('should call prisma.service.delete if service found', async () => {
      const existing = { id: '1', userId: 'user-1' };
      jest.spyOn(prisma.service, 'findFirst').mockResolvedValue(existing as any);
      
      await repository.delete('1', 'user-1');
      expect(prisma.service.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});