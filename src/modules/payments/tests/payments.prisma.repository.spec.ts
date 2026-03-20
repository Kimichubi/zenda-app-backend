import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { PaymentsPrismaRepository } from "../payments.prisma.repository";

describe("PaymentsPrismaRepository", () => {
  let repository: PaymentsPrismaRepository;

  const prismaMock = {
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsPrismaRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = moduleRef.get(PaymentsPrismaRepository);
    jest.clearAllMocks();
  });

  it("should create", async () => {
    prismaMock.payment.create.mockResolvedValue({ id: "p1" });
    const res = await repository.create({ appointmentId: "a1", amount: 100 });
    expect(res.id).toBe("p1");
    expect(prismaMock.payment.create).toHaveBeenCalled();
  });

  it("should create pix", async () => {
    prismaMock.payment.create.mockResolvedValue({ id: "p1" });
    const res = await repository.createPix({ appointmentId: "a1", amount: 100, pixCode: "pix" });
    expect(res.id).toBe("p1");
    expect(prismaMock.payment.create).toHaveBeenCalled();
  });

  it("should find many by user id", async () => {
    prismaMock.payment.findMany.mockResolvedValue([{ id: "p1" }]);
    const res = await repository.findManyByUserId("u1");
    expect(res).toEqual([{ id: "p1", status: undefined, pixCode: null, reason: null, paidAt: null }]);
  });

  it("should find by id", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({ id: "p1" });
    const res = await repository.findById("p1");
    expect(res?.id).toBe("p1");
    
    prismaMock.payment.findUnique.mockResolvedValue(null);
    expect(await repository.findById("p1")).toBeNull();
  });

  it("should find by appointment id", async () => {
    prismaMock.payment.findUnique.mockResolvedValue({ id: "p1" });
    const res = await repository.findByAppointmentId("a1");
    expect(res?.id).toBe("p1");
    
    prismaMock.payment.findUnique.mockResolvedValue(null);
    expect(await repository.findByAppointmentId("a1")).toBeNull();
  });

  it("should mark as paid", async () => {
    prismaMock.payment.update.mockResolvedValue({ id: "p1" });
    const res = await repository.markAsPaid("p1");
    expect(res?.id).toBe("p1");
  });

  it("should cancel", async () => {
    prismaMock.payment.update.mockResolvedValue({ id: "p1" });
    const res = await repository.cancel("p1");
    expect(res?.id).toBe("p1");
  });

  it("should update status", async () => {
    prismaMock.payment.update.mockResolvedValue({ id: "p1" });
    const res = await repository.updateStatus("p1", "PAID", "reason", "pix");
    expect(res?.id).toBe("p1");
    expect(prismaMock.payment.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paidAt: expect.any(Date) })
    }));
  });
});
