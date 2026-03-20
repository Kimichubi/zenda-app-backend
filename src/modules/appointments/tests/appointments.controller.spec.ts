import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from '../appointments.controller';
import { AppointmentsService } from '../appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockAppointmentsService = {
    findAll: jest.fn(),
    getByWeek: jest.fn(),
    resendNotification: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    const req = { user: { id: 'user-id' } };
    mockAppointmentsService.findAll.mockResolvedValue([]);
    const result = await controller.findAll(req);
    expect(service.findAll).toHaveBeenCalledWith('user-id');
    expect(result).toEqual([]);
  });

  it('should call getByWeek', async () => {
    const req = { user: { id: 'user-id' } };
    mockAppointmentsService.getByWeek.mockResolvedValue([]);
    const result = await controller.getByWeek(req, '2023-01-01');
    expect(service.getByWeek).toHaveBeenCalledWith('user-id', '2023-01-01');
    expect(result).toEqual([]);
  });

  it('should call resendNotification', async () => {
    const req = { user: { id: 'user-id' } };
    mockAppointmentsService.resendNotification.mockResolvedValue(true);
    const result = await controller.resendNotification(req, '1');
    expect(service.resendNotification).toHaveBeenCalledWith('user-id', '1');
    expect(result).toBe(true);
  });

  it('should call create', async () => {
    const req = { user: { id: 'user-id' } };
    const dto: CreateAppointmentDto = { clientId: 'c1', date: '2023-01-01' };
    mockAppointmentsService.create.mockResolvedValue({ id: '1', ...dto });
    const result = await controller.create(req, dto);
    expect(service.create).toHaveBeenCalledWith('user-id', dto);
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('should call update', async () => {
    const req = { user: { id: 'user-id' } };
    const dto: UpdateAppointmentDto = { status: 'CONFIRMED' as any };
    mockAppointmentsService.update.mockResolvedValue({ id: '1', ...dto });
    const result = await controller.update(req, '1', dto);
    expect(service.update).toHaveBeenCalledWith('user-id', '1', dto);
    expect(result).toEqual({ id: '1', ...dto });
  });
});
