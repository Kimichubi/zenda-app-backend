import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ClientsPrismaRepository } from "../clients.prisma.repository";

describe("ClientsPrismaRepository", () => {
  let repository: ClientsPrismaRepository;

  const prismaMock = {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClientsPrismaRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = moduleRef.get(ClientsPrismaRepository);
    jest.clearAllMocks();
  });

  it("should create client for user", async () => {
    prismaMock.client.create.mockResolvedValue({
      id: "c1",
      userId: "u1",
      name: "Ana",
      phone: "11911111111",
      email: "ana@test.com",
      createdAt: new Date(),
    });

    const result = await repository.create("u1", {
      name: "Ana",
      phone: "11911111111",
      email: "ana@test.com",
    });

    expect(result.id).toBe("c1");
    expect(prismaMock.client.create).toHaveBeenCalled();
  });

  it("should find many clients by user id", async () => {
    prismaMock.client.findMany.mockResolvedValue([{ id: "c1" }]);
    const result = await repository.findManyByUserId("u1");
    expect(result).toEqual([{ id: "c1" }]);
    expect(prismaMock.client.findMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("should find client by email and user id", async () => {
    prismaMock.client.findFirst.mockResolvedValue({ id: "c1" });
    const result = await repository.findByEmailAndUserId("test@test.com", "u1");
    expect(result).toEqual({ id: "c1" });
    expect(prismaMock.client.findFirst).toHaveBeenCalledWith({ where: { email: "test@test.com", userId: "u1" } });
  });

  it("should find client by phone and user id", async () => {
    prismaMock.client.findFirst.mockResolvedValue({ id: "c1" });
    const result = await repository.findByPhoneAndUserId("123", "u1");
    expect(result).toEqual({ id: "c1" });
    expect(prismaMock.client.findFirst).toHaveBeenCalledWith({ where: { phone: "123", userId: "u1" } });
  });

  it("should find client by id", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "c1" });
    const result = await repository.findById("c1");
    expect(result).toEqual({ id: "c1" });
    expect(prismaMock.client.findUnique).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("should update client", async () => {
    prismaMock.client.findFirst.mockResolvedValue({ id: "c1" });
    prismaMock.client.update.mockResolvedValue({ id: "c1", name: "New Name" });
    const result = await repository.update("c1", "u1", { name: "New Name" });
    expect(result).toEqual({ id: "c1", name: "New Name" });
    expect(prismaMock.client.update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { name: "New Name" }
    });
  });

  it("should not update client if not found", async () => {
    prismaMock.client.findFirst.mockResolvedValue(null);
    const result = await repository.update("c1", "u1", { name: "New Name" });
    expect(result).toBeNull();
  });

  it("should delete client", async () => {
    prismaMock.client.findFirst.mockResolvedValue({ id: "c1" });
    await repository.delete("c1", "u1");
    expect(prismaMock.client.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("should not delete client if not found", async () => {
    prismaMock.client.findFirst.mockResolvedValue(null);
    await repository.delete("c1", "u1");
    expect(prismaMock.client.delete).not.toHaveBeenCalled();
  });
});