import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { UsersPrismaRepository } from "../users.prisma.repository";

describe("UsersPrismaRepository", () => {
  let repository: UsersPrismaRepository;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
    prismaMock.user.create.mockResolvedValue({
      id: "u1",
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      createdAt: new Date(),
    });

    const result = await repository.create({
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      phone: "",
      businessName: "",
      slug: "joao",
    });

    expect(result.id).toBe("u1");
    expect(prismaMock.user.create).toHaveBeenCalled();
  });
});
