import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { UsersRepository } from "../../users/users.repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  const usersRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue("token"),
  };
  const prismaService = {
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue("test-secret"),
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
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jest.clearAllMocks();
    jwtService.sign.mockReturnValue("token");
  });

  describe("signup", () => {
    it("should throw ConflictException if email exists", async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: "1" });

      await expect(
        service.signup({
          name: "Joao",
          email: "joao@test.com",
          password: "123",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("should signup and return access/refresh tokens", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

      usersRepository.create.mockResolvedValue({
        id: "u1",
        name: "João Silva!",
        email: "joao@test.com",
        passwordHash: "hash",
        createdAt: new Date(),
        role: "USER",
        plan: "FREE",
      });

      const result = await service.signup({
        name: "João Silva!",
        email: "joao@test.com",
        password: "123",
        phone: "11999999999",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("123", 12);
      expect(usersRepository.create).toHaveBeenCalledWith({
        name: "João Silva!",
        email: "joao@test.com",
        passwordHash: "hashed-password",
        phone: "11999999999",
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe("joao@test.com");
    });
    
    it("should signup with fallback phone and businessName", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

      usersRepository.create.mockResolvedValue({
        id: "u1",
        name: "Joao",
        email: "joao@test.com",
        passwordHash: "hash",
        createdAt: new Date(),
        role: "USER",
        plan: "FREE",
      });

      const result = await service.signup({
        name: "Joao",
        email: "joao@test.com",
        password: "123",
      });

      expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        phone: "",
      }));
    });
  });

  describe("login", () => {
    it("should throw when login credentials are invalid (user not found)", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "x@test.com", password: "123" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("should throw when login credentials are invalid (wrong password)", async () => {
      usersRepository.findByEmail.mockResolvedValue({
        id: "u1",
        passwordHash: "hashed",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "x@test.com", password: "123" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("should return tokens on valid login", async () => {
      usersRepository.findByEmail.mockResolvedValue({
        id: "u1",
        name: "Test",
        email: "x@test.com",
        passwordHash: "hashed",
        role: "USER",
        plan: "FREE",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: "x@test.com", password: "123" });

      expect(result.accessToken).toBe("token");
      expect(result.refreshToken).toBe("token");
      expect(result.user.id).toBe("u1");
      expect(result.user.email).toBe("x@test.com");
      expect(result.user.name).toBe("Test");
      expect(result.user.role).toBe("USER");
    });
  });

  describe("refreshToken", () => {
    it("should throw UnauthorizedException if user not found", async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken("u1", "x@test.com"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("should return tokens on valid refresh", async () => {
      usersRepository.findById.mockResolvedValue({
        id: "u1",
        name: "Test",
        email: "x@test.com",
        role: "USER",
        plan: "FREE",
      });

      const result = await service.refreshToken("u1", "x@test.com");

      expect(result.accessToken).toBe("token");
      expect(result.refreshToken).toBe("token");
      expect(result.user.id).toBe("u1");
    });
  });
});
