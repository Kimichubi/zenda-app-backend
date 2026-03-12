import { Test } from "@nestjs/testing";
import { InMemoryDatabaseService } from "../../../infrastructure/database/in-memory-database.service";
import { SchedulesService } from "../schedules.service";
import { SchedulesRepository } from "../schedules.repository";
import { SchedulesInMemoryRepository } from "../schedules.in-memory.repository";

describe("SchedulesService", () => {
  let service: SchedulesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        InMemoryDatabaseService,
        SchedulesInMemoryRepository,
        {
          provide: SchedulesRepository,
          useExisting: SchedulesInMemoryRepository,
        },
        SchedulesService,
      ],
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
