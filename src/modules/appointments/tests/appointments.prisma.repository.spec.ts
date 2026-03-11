import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { AppointmentsPrismaRepository } from "../appointments.prisma.repository";

describe("AppointmentsPrismaRepository", () => {
  let repository: AppointmentsPrismaRepository;

  const prismaMock = {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
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

  it("should create appointment", async () => {
    prismaMock.appointment.create.mockResolvedValue({
      id: "a1",
      userId: "u1",
      clientId: "c1",
      date: new Date("2026-03-11T10:00:00.000Z"),
      status: "CONFIRMED",
      createdAt: new Date(),
    });

    const result = await repository.create("u1", {
      clientId: "c1",
      date: new Date("2026-03-11T10:00:00.000Z"),
    });

    expect(result.id).toBe("a1");
    expect(prismaMock.appointment.create).toHaveBeenCalled();
  });
});
