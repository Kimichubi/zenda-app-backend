import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { UsersRepository } from "../../users/users.repository";

describe("AuthService", () => {
  let service: AuthService;
  const usersRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue("token"),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: UsersRepository,
          useValue: usersRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jest.clearAllMocks();
    jwtService.sign.mockReturnValue("token");
  });

  it("should signup and return access/refresh tokens", async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue({
      id: "u1",
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      createdAt: new Date(),
    });

    const result = await service.signup({
      name: "Joao",
      email: "joao@test.com",
      password: "123456",
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe("joao@test.com");
  });

  it("should throw when login credentials are invalid", async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: "x@test.com", password: "123456" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
