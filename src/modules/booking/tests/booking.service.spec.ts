import { Test } from "@nestjs/testing";
import { BookingService } from "../booking.service";
import { UsersRepository } from "../../users/users.repository";
import { ServicesRepository } from "../../services/services.repository";
import { AppointmentsRepository } from "../../appointments/appointments.repository";
import { ClientsRepository } from "../../clients/clients.repository";
import { SchedulesRepository } from "../../schedules/schedules.repository";
import { NotFoundException, ConflictException } from "@nestjs/common";

describe("BookingService", () => {
  let service: BookingService;

  const mockUsersRepo = { findBySlug: jest.fn() };
  const mockServicesRepo = { findManyByUserId: jest.fn(), findById: jest.fn() };
  const mockAppointmentsRepo = { findByWeek: jest.fn(), findConflict: jest.fn(), create: jest.fn() };
  const mockClientsRepo = { findByPhoneAndUserId: jest.fn(), create: jest.fn() };
  const mockSchedulesRepo = { list: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: UsersRepository, useValue: mockUsersRepo },
        { provide: ServicesRepository, useValue: mockServicesRepo },
        { provide: AppointmentsRepository, useValue: mockAppointmentsRepo },
        { provide: ClientsRepository, useValue: mockClientsRepo },
        { provide: SchedulesRepository, useValue: mockSchedulesRepo },
      ],
    }).compile();

    service = moduleRef.get(BookingService);
    jest.clearAllMocks();
  });

  describe("getServices", () => {
    it("should return services", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findManyByUserId.mockResolvedValue([{ id: "s1" }]);
      expect(await service.getServices("slug")).toEqual([{ id: "s1" }]);
    });
    it("should throw NotFound if user not found", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue(null);
      await expect(service.getServices("slug")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getAvailableSlots", () => {
    it("should throw if user not found", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue(null);
      await expect(service.getAvailableSlots("slug", "2023-01-01", "s1")).rejects.toThrow(NotFoundException);
    });
    it("should throw if service not found", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue(null);
      await expect(service.getAvailableSlots("slug", "2023-01-01", "s1")).rejects.toThrow(NotFoundException);
    });
    it("should return empty if no schedule for weekday", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue({ id: "s1", duration: 30 });
      mockSchedulesRepo.list.mockResolvedValue([]);
      expect(await service.getAvailableSlots("slug", "2023-01-01", "s1")).toEqual([]);
    });
    it("should return slots correctly", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue({ id: "s1", duration: 60 });
      const date = new Date("2023-01-02T12:00:00Z"); // a Monday
      mockSchedulesRepo.list.mockResolvedValue([{ weekday: date.getDay(), startTime: "09:00", endTime: "11:00" }]);
      mockAppointmentsRepo.findByWeek.mockResolvedValue([
        { date: date, startTime: "09:30", status: "CONFIRMED" } // 09:30 is booked
      ]);
      const slots = await service.getAvailableSlots("slug", date.toISOString(), "s1");
      expect(slots).toEqual([
        { time: "09:00", available: true },
        { time: "09:30", available: false },
        { time: "10:00", available: true }
      ]);
    });
  });

  describe("createBooking", () => {
    it("should throw if user not found", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue(null);
      await expect(service.createBooking("slug", {} as any)).rejects.toThrow(NotFoundException);
    });
    it("should throw if service not found", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue(null);
      await expect(service.createBooking("slug", {} as any)).rejects.toThrow(NotFoundException);
    });
    it("should throw if conflict", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue({ id: "s1" });
      mockAppointmentsRepo.findConflict.mockResolvedValue(true);
      await expect(service.createBooking("slug", { date: "2023-01-01" } as any)).rejects.toThrow(ConflictException);
    });
    it("should create booking for existing client", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue({ id: "s1", duration: 30, price: 100 });
      mockAppointmentsRepo.findConflict.mockResolvedValue(false);
      mockClientsRepo.findByPhoneAndUserId.mockResolvedValue({ id: "c1" });
      
      const res = await service.createBooking("slug", { serviceId: "s1", date: "2023-01-01", startTime: "10:00", clientName: "N", clientPhone: "P" });
      expect(res).toEqual({ message: "Booking created successfully" });
      expect(mockAppointmentsRepo.create).toHaveBeenCalledWith("u1", expect.objectContaining({
        clientId: "c1", startTime: "10:00", endTime: "10:30", price: 100
      }));
    });
    it("should create booking for new client", async () => {
      mockUsersRepo.findBySlug.mockResolvedValue({ id: "u1" });
      mockServicesRepo.findById.mockResolvedValue({ id: "s1", duration: 30, price: 100 });
      mockAppointmentsRepo.findConflict.mockResolvedValue(false);
      mockClientsRepo.findByPhoneAndUserId.mockResolvedValue(null);
      mockClientsRepo.create.mockResolvedValue({ id: "c2" });
      
      await service.createBooking("slug", { serviceId: "s1", date: "2023-01-01", startTime: "10:00", clientName: "N", clientPhone: "P" });
      expect(mockClientsRepo.create).toHaveBeenCalledWith("u1", { name: "N", phone: "P", email: undefined });
      expect(mockAppointmentsRepo.create).toHaveBeenCalledWith("u1", expect.objectContaining({
        clientId: "c2"
      }));
    });
  });
});
