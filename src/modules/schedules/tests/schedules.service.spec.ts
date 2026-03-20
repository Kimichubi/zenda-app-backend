import { Test } from "@nestjs/testing";
import { SchedulesService } from "../schedules.service";
import { SchedulesRepository } from "../schedules.repository";

describe("SchedulesService", () => {
  let service: SchedulesService;
  const schedulesRepository = {
    list: jest.fn(),
    upsert: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: SchedulesRepository,
          useValue: schedulesRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(SchedulesService);
    jest.clearAllMocks();
  });

  describe("list", () => {
    it("should list schedules", async () => {
      schedulesRepository.list.mockResolvedValue([{ id: "s1" }]);
      const res = await service.list("u1");
      expect(res).toEqual([{ id: "s1" }]);
    });
  });

  describe("upsert", () => {
    it("should upsert schedule", async () => {
      schedulesRepository.upsert.mockResolvedValue({ id: "s1", active: true });
      const res = await service.upsert("u1", {
        dayOfWeek: 1,
        active: true,
        startTime: "09:00",
        endTime: "18:00",
      });
      expect(res).toEqual({ id: "s1", active: true });
      expect(schedulesRepository.upsert).toHaveBeenCalledWith("u1", {
        dayOfWeek: 1,
        active: true,
        startTime: "09:00",
        endTime: "18:00",
      });
    });
  });
});
