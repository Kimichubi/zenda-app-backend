import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { PaymentsPrismaRepository } from "../payments.prisma.repository";

describe("PaymentsPrismaRepository", () => {
  let repository: PaymentsPrismaRepository;

  const prismaMock = {
    payment: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsPrismaRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = moduleRef.get(PaymentsPrismaRepository);
    jest.clearAllMocks();
  });

  it("should create pix payment", async () => {
    prismaMock.payment.create.mockResolvedValue({
      id: "p1",
      appointmentId: "a1",
      amount: 100,
      status: "PENDING",
      pixCode: "PIX-123",
      createdAt: new Date(),
    });

    const result = await repository.createPix({
      appointmentId: "a1",
      amount: 100,
      pixCode: "PIX-123",
    });

    expect(result.id).toBe("p1");
    expect(prismaMock.payment.create).toHaveBeenCalled();
  });
});
