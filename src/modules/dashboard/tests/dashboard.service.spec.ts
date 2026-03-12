import { Test } from "@nestjs/testing";
import { AppointmentsRepository } from "../../appointments/appointments.repository";
import { PaymentsRepository } from "../../payments/payments.repository";
import { DashboardService } from "../dashboard.service";

describe("DashboardService", () => {
  let service: DashboardService;

  const appointmentsRepoMock = {
    findTodayByUserId: jest.fn().mockResolvedValue([]),
    findUpcomingByUserId: jest.fn().mockResolvedValue([]),
  };

  const paymentsRepoMock = {
    findManyByUserId: jest.fn().mockResolvedValue([]),
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

  it("should return summary object", async () => {
    const summary = await service.summary("u1");
    expect(summary.todayRevenue).toBe(0);
    expect(summary.todayAppointments).toEqual([]);
  });
});
