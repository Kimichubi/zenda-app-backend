import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AppointmentsPrismaRepository } from "../appointments.prisma.repository";

describe("AppointmentsPrismaRepository", () => {
  let repository: AppointmentsPrismaRepository;

  const prismaMock = {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsPrismaRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = moduleRef.get(AppointmentsPrismaRepository);
    jest.clearAllMocks();
  });

  it("should find many by user id", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([{ id: "a1" }]);
    const result = await repository.findManyByUserId("u1");
    expect(result).toEqual([{ id: "a1" }]);
    expect(prismaMock.appointment.findMany).toHaveBeenCalled();
  });

  it("should find conflict", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({ id: "a1" });
    const date = new Date();
    const result = await repository.findConflict("u1", date, "10:00");
    expect(result).toEqual({ id: "a1" });
    expect(prismaMock.appointment.findFirst).toHaveBeenCalled();
    
    const resultNoTime = await repository.findConflict("u1", date);
    expect(prismaMock.appointment.findFirst).toHaveBeenCalled();
  });

  it("should find by week", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([{ id: "a1" }]);
    const date = new Date();
    const result = await repository.findByWeek("u1", date);
    expect(result).toEqual([{ id: "a1" }]);
    expect(prismaMock.appointment.findMany).toHaveBeenCalled();
  });

  it("should find by client id", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([{ id: "a1" }]);
    const result = await repository.findByClientId("c1");
    expect(result).toEqual([{ id: "a1" }]);
    expect(prismaMock.appointment.findMany).toHaveBeenCalled();
  });

  it("should find by id", async () => {
    prismaMock.appointment.findUnique.mockResolvedValue({ id: "a1" });
    const result = await repository.findById("a1");
    expect(result).toEqual({ id: "a1" });
    expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith({ where: { id: "a1" }, include: expect.any(Object) });
  });

  it("should find today by user id", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([{ id: "a1" }]);
    const result = await repository.findTodayByUserId("u1");
    expect(result).toEqual([{ id: "a1" }]);
    expect(prismaMock.appointment.findMany).toHaveBeenCalled();
  });

  it("should find upcoming by user id", async () => {
    prismaMock.appointment.findMany.mockResolvedValue([{ id: "a1" }]);
    const result = await repository.findUpcomingByUserId("u1");
    expect(result).toEqual([{ id: "a1" }]);
    expect(prismaMock.appointment.findMany).toHaveBeenCalled();
  });

  it("should create", async () => {
    prismaMock.appointment.create.mockResolvedValue({ id: "a1" });
    const result = await repository.create("u1", { clientId: "c1", date: new Date(), serviceId: "s1" });
    expect(result).toEqual({ id: "a1" });
    expect(prismaMock.appointment.create).toHaveBeenCalled();
    
    const resultNoService = await repository.create("u1", { clientId: "c1", date: new Date() });
    expect(prismaMock.appointment.create).toHaveBeenCalled();
  });
  
  it("should throw error if userId is missing on create", async () => {
    await expect(repository.create("", { clientId: "c1", date: new Date() })).rejects.toThrow("userId is required");
  });

  it("should update status", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({ id: "a1" });
    prismaMock.appointment.update.mockResolvedValue({ id: "a1", status: "CONFIRMED" });
    const result = await repository.updateStatus("a1", "u1", "CONFIRMED" as any);
    expect(result).toEqual({ id: "a1", status: "CONFIRMED" });
    expect(prismaMock.appointment.update).toHaveBeenCalled();
  });

  it("should return null if update status not found", async () => {
    prismaMock.appointment.findFirst.mockResolvedValue(null);
    const result = await repository.updateStatus("a1", "u1", "CONFIRMED" as any);
    expect(result).toBeNull();
  });
});
