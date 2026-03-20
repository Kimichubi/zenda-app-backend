import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { UsersPrismaRepository } from "../users.prisma.repository";

describe("UsersPrismaRepository", () => {
  let repository: UsersPrismaRepository;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersPrismaRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = moduleRef.get(UsersPrismaRepository);
    jest.clearAllMocks();
  });

  it("should create user", async () => {
    const mockUser = {
      id: "u1",
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      role: "USER",
      plan: "FREE",
      createdAt: new Date(),
    };
    prismaMock.user.create.mockResolvedValue(mockUser);

    const input = {
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      phone: "123",
      businessName: "Biz",
      slug: "joao",
    };

    const result = await repository.create(input);

    expect(result).toEqual(mockUser);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        ...input,
        role: "USER",
        plan: "FREE",
      },
    });
  });

  it("should findByEmail", async () => {
    const mockUser = { id: "u1", email: "test@test.com" };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await repository.findByEmail("test@test.com");
    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@test.com" } });
  });

  it("should findById", async () => {
    const mockUser = { id: "u1" };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await repository.findById("u1");
    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("should findBySlug", async () => {
    const mockUser = { id: "u1", slug: "slug" };
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await repository.findBySlug("slug");
    expect(result).toEqual(mockUser);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { slug: "slug" } });
  });

  it("should findAll", async () => {
    const mockUsers = [{ id: "u1" }, { id: "u2" }];
    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    const result = await repository.findAll();
    expect(result).toEqual(mockUsers);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
  });

  it("should update", async () => {
    const mockUser = { id: "u1", name: "Updated" };
    prismaMock.user.update.mockResolvedValue(mockUser);

    const result = await repository.update("u1", { name: "Updated" });
    expect(result).toEqual(mockUser);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Updated" },
    });
  });
});
