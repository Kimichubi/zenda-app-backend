import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppointmentsService } from "../appointments.service";
import { AppointmentsRepository } from "../appointments.repository";
import { ServicesRepository } from "../../services/services.repository";
import { ClientsRepository } from "../../clients/clients.repository";
import { UsersRepository } from "../../users/users.repository";
import { WhatsappService } from "../../../infrastructure/notifications/whatsapp.service";
import { PaymentsRepository } from "../../payments/payments.repository";

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  const appointmentsRepository = {
    findManyByUserId: jest.fn(),
    findByWeek: jest.fn(),
    findConflict: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
  };
  const servicesRepository = {
    findById: jest.fn(),
  };
  const clientsRepository = {
    findById: jest.fn(),
  };
  const usersRepository = {
    findById: jest.fn(),
  };
  const whatsappService = {
    sendConfirmation: jest.fn(),
  };
  const paymentsRepository = {
    create: jest.fn(),
    findByAppointmentId: jest.fn(),
    updateStatus: jest.fn(),
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
        {
          provide: ClientsRepository,
          useValue: clientsRepository,
        },
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
        {
          provide: WhatsappService,
          useValue: whatsappService,
        },
        {
          provide: PaymentsRepository,
          useValue: paymentsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(AppointmentsService);
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return appointments for a user", async () => {
      appointmentsRepository.findManyByUserId.mockResolvedValue([{ id: "a1" }]);
      const res = await service.findAll("u1");
      expect(res).toEqual([{ id: "a1" }]);
    });
  });

  describe("getByWeek", () => {
    it("should return appointments for a user by week", async () => {
      appointmentsRepository.findByWeek.mockResolvedValue([{ id: "a1" }]);
      const res = await service.getByWeek("u1", "2026-03-11");
      expect(res).toEqual([{ id: "a1" }]);
    });
  });

  describe("create", () => {
    it("should create appointment when no conflict", async () => {
      appointmentsRepository.findConflict.mockResolvedValue(null);
      appointmentsRepository.create.mockResolvedValue({ id: "a1" });
      servicesRepository.findById.mockResolvedValue({ name: "Haircut", duration: 60, price: 50 });
      clientsRepository.findById.mockResolvedValue({ name: "John", phone: "123" });
      usersRepository.findById.mockResolvedValue({ businessName: "Salon" });
      whatsappService.sendConfirmation.mockResolvedValue(undefined);

      const appointment = await service.create("u1", {
        clientId: "c1",
        serviceId: "s1",
        date: "2026-03-11T15:00:00.000Z",
        startTime: "15:00",
      });

      expect(appointment.id).toBe("a1");
      expect(paymentsRepository.create).toHaveBeenCalledWith({
        appointmentId: "a1",
        amount: 50,
        status: "PENDING",
      });
      // Fire and forget, no direct await in test without delay.
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(whatsappService.sendConfirmation).toHaveBeenCalled();
    });

    it("should throw conflict exception if user id missing", async () => {
      await expect(service.create("", { clientId: "c1", date: "2026-03-11" })).rejects.toThrow(ConflictException);
    });

    it("should throw conflict exception when timeslot conflicts", async () => {
      appointmentsRepository.findConflict.mockResolvedValue({ id: "a-existing" });

      await expect(
        service.create("u1", {
          clientId: "c1",
          date: "2026-03-11T15:00:00.000Z",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("update", () => {
    it("should update appointment status", async () => {
      appointmentsRepository.updateStatus.mockResolvedValue({ id: "a1", status: "CONFIRMED" });
      const res = await service.update("u1", "a1", { status: "CONFIRMED" });
      expect(res).toEqual({ id: "a1", status: "CONFIRMED" });
    });

    it("should sync payment status when cancelled", async () => {
      appointmentsRepository.updateStatus.mockResolvedValue({ id: "a1", status: "CANCELLED" });
      paymentsRepository.findByAppointmentId.mockResolvedValue({ id: "p1" });
      await service.update("u1", "a1", { status: "CANCELLED" });
      expect(paymentsRepository.updateStatus).toHaveBeenCalledWith("p1", "CANCELLED", "Agendamento cancelado");
    });

    it("should sync payment status when no-show", async () => {
      appointmentsRepository.updateStatus.mockResolvedValue({ id: "a1", status: "NO_SHOW" });
      paymentsRepository.findByAppointmentId.mockResolvedValue({ id: "p1" });
      await service.update("u1", "a1", { status: "NO_SHOW" });
      expect(paymentsRepository.updateStatus).toHaveBeenCalledWith("p1", "FAILED", "Cliente não compareceu");
    });
  });

  describe("resendNotification", () => {
    it("should resend notification", async () => {
      appointmentsRepository.findById.mockResolvedValue({
        userId: "u1",
        clientId: "c1",
        date: new Date(),
        startTime: "10:00",
        service: { name: "Haircut" }
      });
      clientsRepository.findById.mockResolvedValue({ name: "John", phone: "123" });
      usersRepository.findById.mockResolvedValue({ businessName: "Salon" });

      await service.resendNotification("u1", "a1");
      expect(whatsappService.sendConfirmation).toHaveBeenCalled();
    });

    it("should throw not found if appointment missing or wrong user", async () => {
      appointmentsRepository.findById.mockResolvedValue(null);
      await expect(service.resendNotification("u1", "a1")).rejects.toThrow(NotFoundException);
    });
  });
});
