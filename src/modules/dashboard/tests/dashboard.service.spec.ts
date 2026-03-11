import { Test } from "@nestjs/testing";
import { InMemoryDatabaseService } from "../../../infrastructure/database/in-memory-database.service";
import { DashboardService } from "../dashboard.service";

describe("DashboardService", () => {
  let service: DashboardService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [InMemoryDatabaseService, DashboardService],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it("should return summary object", () => {
    const summary = service.summary("u1");
    expect(summary.totalRevenue).toBe(0);
  });
});
