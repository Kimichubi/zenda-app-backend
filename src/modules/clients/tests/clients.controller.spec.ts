import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from '../clients.controller';
import { ClientsService } from '../clients.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { FindClientsDto } from '../dto/find-clients.dto';

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

  it('should call findAll with query dto', async () => {
    const user = { sub: 'user-id' };
    const queryDto: FindClientsDto = { search: 'test', page: 1, limit: 10 };
    const mockResult = { data: [], total: 0, page: 1, limit: 10 };
    mockClientsService.findAll.mockResolvedValue(mockResult);
    
    const result = await controller.findAll(user, queryDto);
    
    expect(service.findAll).toHaveBeenCalledWith(user.sub, queryDto);
    expect(result).toEqual(mockResult);
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
