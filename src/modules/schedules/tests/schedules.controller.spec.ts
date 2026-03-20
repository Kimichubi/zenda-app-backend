import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesController } from '../schedules.controller';
import { SchedulesService } from '../schedules.service';

describe('SchedulesController', () => {
  let controller: SchedulesController;
  let service: SchedulesService;

  const mockService = {
    list: jest.fn(),
    upsert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulesController],
      providers: [{ provide: SchedulesService, useValue: mockService }],
    }).compile();

    controller = module.get<SchedulesController>(SchedulesController);
    service = module.get<SchedulesService>(SchedulesService);
    jest.clearAllMocks();
  });

  it('should call list', async () => {
    mockService.list.mockResolvedValue([]);
    const result = await controller.list({ id: 'u1' });
    expect(service.list).toHaveBeenCalledWith('u1');
    expect(result).toEqual([]);
  });

  it('should call upsert', async () => {
    mockService.upsert.mockResolvedValue({ id: '1' });
    const dto = { weekday: 1, startTime: '09:00', endTime: '18:00' };
    const result = await controller.upsert({ id: 'u1' }, dto);
    expect(service.upsert).toHaveBeenCalledWith('u1', dto);
    expect(result).toEqual({ id: '1' });
  });
});
