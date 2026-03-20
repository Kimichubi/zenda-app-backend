import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { SchedulesPrismaRepository } from "../schedules.prisma.repository";

describe("SchedulesPrismaRepository", () => {
  let repository: SchedulesPrismaRepository;

  const prismaMock = {
    schedule: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchedulesPrismaRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = moduleRef.get(SchedulesPrismaRepository);
    jest.clearAllMocks();
  });

  it("should list", async () => {
    prismaMock.schedule.findMany.mockResolvedValue([{ id: "s1" }]);
    const res = await repository.list("u1");
    expect(res).toEqual([{ id: "s1" }]);
  });

  it("should upsert", async () => {
    prismaMock.schedule.upsert.mockResolvedValue({ id: "s1" });
    const res = await repository.upsert("u1", { weekday: 1, startTime: "09:00", endTime: "18:00" });
    expect(res.id).toBe("s1");
    expect(prismaMock.schedule.upsert).toHaveBeenCalled();
  });
});
