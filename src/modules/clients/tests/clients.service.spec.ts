import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ClientsService } from "../clients.service";
import { ClientsRepository } from "../clients.repository";

describe("ClientsService", () => {
  let service: ClientsService;
  const clientsRepository = {
    findManyByUserId: jest.fn(),
    findByEmailAndUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: ClientsRepository,
          useValue: clientsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ClientsService);
    jest.clearAllMocks();
  });

  it("should create a client", async () => {
    clientsRepository.findByEmailAndUserId.mockResolvedValue(null);
    clientsRepository.create.mockResolvedValue({
      id: "c1",
      name: "Ana",
      email: "ana@test.com",
      phone: "11911111111",
      userId: "u1",
      createdAt: new Date(),
    });

    const client = await service.create("u1", {
      name: "Ana",
      email: "ana@test.com",
      phone: "11911111111",
    });

    expect(client.id).toBe("c1");
    expect(clientsRepository.create).toHaveBeenCalled();
  });

  it("should prevent duplicated email per user", async () => {
    clientsRepository.findByEmailAndUserId.mockResolvedValue({
      id: "c-existing",
    });

    await expect(
      service.create("u1", {
        name: "Ana",
        email: "ana@test.com",
        phone: "11911111111",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
