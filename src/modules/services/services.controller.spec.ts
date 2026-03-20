import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

  beforeEach(async () => {
    const mockServicesService = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call servicesService.findAll with user id', async () => {
      const user = { id: 'user-1' };
      const expectedResult = [{ id: '1', name: 'Test' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult as any);

      const result = await controller.findAll(user);

      expect(service.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expectedResult);
    });
  });

  describe('create', () => {
    it('should call servicesService.create with user id and dto', async () => {
      const user = { id: 'user-1' };
      const dto: CreateServiceDto = { name: 'Test', duration: 30, price: 100 };
      const expectedResult = { id: '1', ...dto };
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult as any);

      const result = await controller.create(user, dto);

      expect(service.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('update', () => {
    it('should call servicesService.update with user id, id, and dto', async () => {
      const user = { id: 'user-1' };
      const id = 'service-1';
      const dto: UpdateServiceDto = { name: 'Updated' };
      const expectedResult = { id, name: 'Updated' };
      jest.spyOn(service, 'update').mockResolvedValue(expectedResult as any);

      const result = await controller.update(user, id, dto);

      expect(service.update).toHaveBeenCalledWith('user-1', id, dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call servicesService.remove with user id and id', async () => {
      const user = { id: 'user-1' };
      const id = 'service-1';
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(user, id);

      expect(service.remove).toHaveBeenCalledWith('user-1', id);
    });
  });
});