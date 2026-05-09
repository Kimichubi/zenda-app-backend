import { Test } from "@nestjs/testing";
import { AvailabilityService } from "../availability.service";
import { SchedulesRepository } from "../schedules.repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ServicesRepository } from "../../services/services.repository";

describe("AvailabilityService", () => {
  let service: AvailabilityService;
  let schedulesRepository: any;
  let servicesRepository: any;
  let prisma: any;

  beforeEach(async () => {
    schedulesRepository = {
      findByProfessionalAndWeekday: jest.fn(),
    };

    servicesRepository = {
      findById: jest.fn(),
    };

    prisma = {
      blockedSlot: {
        findMany: jest.fn(),
      },
      appointment: {
        findMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: SchedulesRepository, useValue: schedulesRepository },
        { provide: ServicesRepository, useValue: servicesRepository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AvailabilityService);
  });

  describe("getAvailability", () => {
    it("should return empty slots when no schedule exists", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue(null);

      const result = await service.getAvailability("prof1", "2024-01-15");

      expect(result.slots).toHaveLength(0);
    });

    it("should generate slots based on schedule", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "12:00",
        slotDuration: 30,
        isActive: true,
      });

      prisma.blockedSlot.findMany.mockResolvedValue([]);
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailability("prof1", "2024-01-15");

      expect(result.slots.length).toBeGreaterThan(0);
    });

    it("should mark slots as unavailable when blocked", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: 30,
        isActive: true,
      });

      prisma.blockedSlot.findMany.mockResolvedValue([{
        id: "b1",
        date: new Date("2024-01-15"),
        startTime: "10:00",
        endTime: "11:00",
        reason: "MANUAL_BLOCK",
      }]);
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailability("prof1", "2024-01-15");

      const blockedSlot = result.slots.find(s => s.time === "10:00");
      expect(blockedSlot?.available).toBe(false);
      expect(blockedSlot?.reason).toBe("Blocked: MANUAL_BLOCK");
    });
  });

  describe("checkSlotAvailable", () => {
    it("should return unavailable when professional not working", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue(null);

      const result = await service.checkSlotAvailable("prof1", "2024-01-15", "10:00");

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Professional not working on this day");
    });

    it("should return unavailable outside working hours", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "12:00",
        isActive: true,
      });

      const result = await service.checkSlotAvailable("prof1", "2024-01-15", "14:00", undefined);

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Outside working hours");
    });

    it("should return unavailable during break time", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        isActive: true,
      });

      const result = await service.checkSlotAvailable("prof1", "2024-01-15", "12:30");

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Conflicts with break time");
    });

    it("should return available when slot is free", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "18:00",
        isActive: true,
      });

      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.blockedSlot.findMany.mockResolvedValue([]);

      const result = await service.checkSlotAvailable("prof1", "2024-01-15", "10:00");

      expect(result.available).toBe(true);
    });

    it("should respect service duration when checking availability", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "12:00",
        isActive: true,
      });

      servicesRepository.findById.mockResolvedValue({ duration: 50 });

      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.blockedSlot.findMany.mockResolvedValue([]);

      const result = await service.checkSlotAvailable("prof1", "2024-01-15", "11:30", "service1");

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Outside working hours");
    });
  });

  describe("validateBooking", () => {
    it("should throw ConflictException when slot not available", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue(null);

      await expect(service.validateBooking("prof1", "2024-01-15", "10:00"))
        .rejects.toThrow("Professional not working on this day");
    });

    it("should not throw when slot is available", async () => {
      schedulesRepository.findByProfessionalAndWeekday.mockResolvedValue({
        id: "s1",
        startTime: "09:00",
        endTime: "18:00",
        isActive: true,
      });

      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.blockedSlot.findMany.mockResolvedValue([]);

      await expect(service.validateBooking("prof1", "2024-01-15", "10:00")).resolves.not.toThrow();
    });
  });
});