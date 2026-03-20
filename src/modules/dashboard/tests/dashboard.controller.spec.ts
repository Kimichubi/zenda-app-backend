import { Test, TestingModule } from "@nestjs/testing";
import { DashboardController } from "../dashboard.controller";
import { DashboardService } from "../dashboard.service";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";

describe("DashboardController", () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const mockService = {
      summary: jest.fn().mockResolvedValue({ todayRevenue: 100 }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(DashboardController);
    service = moduleRef.get(DashboardService);
  });

  it("should return dashboard summary", async () => {
    const result = await controller.summary({ id: "user-123" });
    expect(result).toEqual({ todayRevenue: 100 });
    expect(service.summary).toHaveBeenCalledWith("user-123");
  });
});
