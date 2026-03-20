import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: ServicesRepository;

  beforeEach(async () => {
    const mockServicesRepository = {
      findManyByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesRepository,
          useValue: mockServicesRepository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get<ServicesRepository>(ServicesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call repository.findManyByUserId', async () => {
      const userId = 'user-1';
      const expectedResult = [{ id: '1' }];
      jest.spyOn(repository, 'findManyByUserId').mockResolvedValue(expectedResult as any);

      const result = await service.findAll(userId);

      expect(repository.findManyByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedResult);
    });
  });

  describe('findById', () => {
    it('should call repository.findById', async () => {
      const id = '1';
      const expectedResult = { id: '1' };
      jest.spyOn(repository, 'findById').mockResolvedValue(expectedResult as any);

      const result = await service.findById(id);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(result).toBe(expectedResult);
    });
  });

  describe('create', () => {
    it('should call repository.create', async () => {
      const userId = 'user-1';
      const dto: CreateServiceDto = { name: 'Test', duration: 30, price: 100 };
      const expectedResult = { id: '1', ...dto };
      jest.spyOn(repository, 'create').mockResolvedValue(expectedResult as any);

      const result = await service.create(userId, dto);

      expect(repository.create).toHaveBeenCalledWith(userId, dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('update', () => {
    it('should call repository.update', async () => {
      const userId = 'user-1';
      const id = 'service-1';
      const dto: UpdateServiceDto = { name: 'Updated' };
      const expectedResult = { id, name: 'Updated' };
      jest.spyOn(repository, 'update').mockResolvedValue(expectedResult as any);

      const result = await service.update(userId, id, dto);

      expect(repository.update).toHaveBeenCalledWith(id, userId, dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call repository.delete', async () => {
      const userId = 'user-1';
      const id = 'service-1';
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      await service.remove(userId, id);

      expect(repository.delete).toHaveBeenCalledWith(id, userId);
    });
  });
});