import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from '../clients.controller';
import { ClientsService } from '../clients.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockClientsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    const user = { sub: 'user-id' };
    mockClientsService.findAll.mockResolvedValue([]);
    const result = await controller.findAll(user);
    expect(service.findAll).toHaveBeenCalledWith(user.sub);
    expect(result).toEqual([]);
  });

  it('should call create', async () => {
    const user = { sub: 'user-id' };
    const dto: CreateClientDto = { name: 'Test', phone: '1234567890' };
    mockClientsService.create.mockResolvedValue({ id: '1', ...dto });
    const result = await controller.create(user, dto);
    expect(service.create).toHaveBeenCalledWith(user.sub, dto);
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('should call update', async () => {
    const user = { sub: 'user-id' };
    const dto: UpdateClientDto = { name: 'Test Updated' };
    mockClientsService.update.mockResolvedValue({ id: '1', ...dto });
    const result = await controller.update(user, '1', dto);
    expect(service.update).toHaveBeenCalledWith(user.sub, '1', dto);
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('should call remove', async () => {
    const user = { sub: 'user-id' };
    mockClientsService.remove.mockResolvedValue(undefined);
    await controller.remove(user, '1');
    expect(service.remove).toHaveBeenCalledWith(user.sub, '1');
  });
});
