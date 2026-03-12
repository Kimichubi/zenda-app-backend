import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppointmentsService } from "../appointments.service";
import { AppointmentsRepository } from "../appointments.repository";
import { ServicesRepository } from "../../services/services.repository";

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  const appointmentsRepository = {
    findManyByUserId: jest.fn(),
    findConflict: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };
  const servicesRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: AppointmentsRepository,
          useValue: appointmentsRepository,
        },
        {
          provide: ServicesRepository,
          useValue: servicesRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
    jest.clearAllMocks();
  });

  it("should create appointment when no conflict", async () => {
    appointmentsRepository.findConflict.mockResolvedValue(null);
    appointmentsRepository.create.mockResolvedValue({
      id: "a1",
      status: "CONFIRMED",
    });

    const appointment = await service.create("u1", {
      clientId: "c1",
      date: "2026-03-11T15:00:00.000Z",
    });

    expect(appointment.id).toBe("a1");
  });

  it("should throw when timeslot conflicts", async () => {
    appointmentsRepository.findConflict.mockResolvedValue({ id: "a-existing" });

    await expect(
      service.create("u1", {
        clientId: "c1",
        date: "2026-03-11T15:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
