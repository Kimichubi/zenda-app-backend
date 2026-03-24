import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from '../payments.controller';
import { PaymentsService } from '../payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockService = {
    createPix: jest.fn(),
    listForUser: jest.fn(),
    getById: jest.fn(),
    markAsPaid: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should call createPix', async () => {
    mockService.createPix.mockResolvedValue({ id: '1' });
    const dto = { appointmentId: 'a1', amount: 100 };
    const result = await controller.createPix(dto);
    expect(service.createPix).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: '1' });
  });

  it('should call list', async () => {
    mockService.listForUser.mockResolvedValue([]);
    const result = await controller.list({ id: 'user1' });
    expect(service.listForUser).toHaveBeenCalledWith('user1');
    expect(result).toEqual([]);
  });

  it('should call getById', async () => {
    mockService.getById.mockResolvedValue({ id: '1' });
    const result = await controller.getById('1');
    expect(service.getById).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });

  it('should call markAsPaid', async () => {
    mockService.markAsPaid.mockResolvedValue({ id: '1' });
    const result = await controller.markAsPaid('1');
    expect(service.markAsPaid).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });

  it('should call cancel', async () => {
    mockService.cancel.mockResolvedValue({ id: '1' });
    const result = await controller.cancel('1');
    expect(service.cancel).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });
});
