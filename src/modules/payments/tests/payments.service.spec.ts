import { Test } from "@nestjs/testing";
import { PaymentsService } from "../payments.service";
import { PaymentsRepository } from "../payments.repository";

describe("PaymentsService", () => {
  let service: PaymentsService;
  const paymentsRepository = {
    createPix: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentsRepository,
          useValue: paymentsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
    jest.clearAllMocks();
  });

  it("should generate pix payment", async () => {
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

    expect(payment.pixCode).toContain("PIX-");
    expect(payment.status).toBe("PENDING");
  });
});
