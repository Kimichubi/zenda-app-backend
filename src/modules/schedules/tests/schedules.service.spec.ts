import { Test } from "@nestjs/testing";
import { InMemoryDatabaseService } from "../../../infrastructure/database/in-memory-database.service";
import { SchedulesService } from "../schedules.service";

describe("SchedulesService", () => {
  let service: SchedulesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [InMemoryDatabaseService, SchedulesService],
    }).compile();

    service = moduleRef.get(SchedulesService);
  });

  it("should upsert schedule", async () => {
    const schedule = await service.upsert("u1", {
      weekday: 1,
      startTime: "09:00",
      endTime: "18:00",
    });

    expect(schedule.weekday).toBe(1);
  });
});
