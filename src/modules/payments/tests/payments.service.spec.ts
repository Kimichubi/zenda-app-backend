import { Test } from "@nestjs/testing";
import { PaymentsService } from "../payments.service";
import { PaymentsRepository } from "../payments.repository";
import { AppointmentsRepository } from "../../appointments/appointments.repository";
import { PaymentQueueService } from "../../../infrastructure/queues/payment.queue.service";
import { NotFoundException } from "@nestjs/common";

describe("PaymentsService", () => {
  let service: PaymentsService;
  const paymentsRepository = {
    createPix: jest.fn(),
    findByAppointmentId: jest.fn(),
    updateStatus: jest.fn(),
    findManyByUserId: jest.fn(),
    findById: jest.fn(),
    markAsPaid: jest.fn(),
    cancel: jest.fn(),
  };
  const appointmentsRepository = {
    findById: jest.fn(),
  };
  const paymentQueueService = {
    enqueuePaymentStatusCheck: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentsRepository,
          useValue: paymentsRepository,
        },
        {
          provide: AppointmentsRepository,
          useValue: appointmentsRepository,
        },
        {
          provide: PaymentQueueService,
          useValue: paymentQueueService,
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
    jest.clearAllMocks();
  });

  describe("createPix", () => {
    it("should generate pix payment using provided amount", async () => {
      paymentsRepository.findByAppointmentId.mockResolvedValue(null);
      paymentsRepository.createPix.mockResolvedValue({
        id: "p1",
        appointmentId: "a1",
        amount: 150,
        status: "PENDING",
        pixCode: "PIX-test",
        createdAt: new Date(),
      });

      const payment = await service.createPix({
        appointmentId: "a1",
        amount: 150,
      });

      expect(payment.pixCode).toBe("PIX-test");
      expect(payment.status).toBe("PENDING");
      expect(paymentQueueService.enqueuePaymentStatusCheck).toHaveBeenCalledWith("p1");
    });

    it("should fetch appointment price if amount is missing", async () => {
      appointmentsRepository.findById.mockResolvedValue({ price: 200 });
      paymentsRepository.findByAppointmentId.mockResolvedValue(null);
      paymentsRepository.createPix.mockResolvedValue({
        id: "p2",
        appointmentId: "a2",
        amount: 200,
        status: "PENDING",
        pixCode: "PIX-test-2",
      });

      const payment = await service.createPix({ appointmentId: "a2" });
      expect(payment.amount).toBe(200);
      expect(appointmentsRepository.findById).toHaveBeenCalledWith("a2");
    });

    it("should throw NotFoundException if amount is missing and appointment not found", async () => {
      appointmentsRepository.findById.mockResolvedValue(null);
      await expect(service.createPix({ appointmentId: "a3" })).rejects.toThrow(NotFoundException);
    });

    it("should throw error if amount is zero or negative", async () => {
      await expect(service.createPix({ appointmentId: "a1", amount: -10 })).rejects.toThrow("Payment amount must be greater than zero");
    });

    it("should update and return existing payment if it already exists", async () => {
      paymentsRepository.findByAppointmentId.mockResolvedValue({ id: "existing-p" });
      paymentsRepository.updateStatus.mockResolvedValue({ id: "existing-p", status: "PENDING" });

      const payment = await service.createPix({ appointmentId: "a1", amount: 100 });
      expect(payment.id).toBe("existing-p");
      expect(paymentsRepository.updateStatus).toHaveBeenCalled();
    });
  });

  describe("listForUser", () => {
    it("should return payments for user", async () => {
      paymentsRepository.findManyByUserId.mockResolvedValue([{ id: "p1" }]);
      const res = await service.listForUser("u1");
      expect(res).toEqual([{ id: "p1" }]);
    });
  });

  describe("getById", () => {
    it("should return payment by id", async () => {
      paymentsRepository.findById.mockResolvedValue({ id: "p1" });
      const res = await service.getById("p1");
      expect(res).toEqual({ id: "p1" });
    });
  });

  describe("markAsPaid", () => {
    it("should mark payment as paid", async () => {
      paymentsRepository.markAsPaid.mockResolvedValue({ id: "p1", status: "PAID" });
      const res = await service.markAsPaid("p1");
      expect(res).toEqual({ id: "p1", status: "PAID" });
    });
  });

  describe("cancel", () => {
    it("should cancel payment", async () => {
      paymentsRepository.cancel.mockResolvedValue({ id: "p1", status: "CANCELLED" });
      const res = await service.cancel("p1");
      expect(res).toEqual({ id: "p1", status: "CANCELLED" });
    });
  });
});
