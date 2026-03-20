import { Test } from "@nestjs/testing";
import { AppointmentsRepository } from "../../appointments/appointments.repository";
import { PaymentsRepository } from "../../payments/payments.repository";
import { DashboardService } from "../dashboard.service";

describe("DashboardService", () => {
  let service: DashboardService;
  
  const mockAppointments = [
    { id: '1', status: 'NO_SHOW' },
    { id: '2', status: 'CONFIRMED' }
  ];

  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  const mockPayments = [
    { id: 'p1', status: 'PAID', paidAt: today, amount: 100 },
    { id: 'p2', status: 'PAID', paidAt: pastDate, amount: 50 },
    { id: 'p3', status: 'PENDING', amount: 200 },
  ];

  const appointmentsRepoMock = {
    findTodayByUserId: jest.fn().mockResolvedValue(mockAppointments),
    findUpcomingByUserId: jest.fn().mockResolvedValue([]),
  };

  const paymentsRepoMock = {
    findManyByUserId: jest.fn().mockResolvedValue(mockPayments),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: AppointmentsRepository, useValue: appointmentsRepoMock },
        { provide: PaymentsRepository, useValue: paymentsRepoMock },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it("should return summary object with revenue and no-shows", async () => {
    const summary = await service.summary("u1");
    expect(summary.todayRevenue).toBe(100);
    expect(summary.todayAppointments).toEqual(mockAppointments);
    expect(summary.upcomingAppointments).toEqual([]);
    expect(summary.noShowClients).toEqual([{ id: '1', status: 'NO_SHOW' }]);
  });
});
