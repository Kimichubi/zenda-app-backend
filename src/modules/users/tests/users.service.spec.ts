import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "../users.service";
import { UsersRepository } from "../users.repository";

describe("UsersService", () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const mockUsersRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("me", () => {
    it("should throw NotFoundException if user not found", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.me("invalid-id")).rejects.toThrow(NotFoundException);
    });

    it("should return user data if found", async () => {
      repository.findById.mockResolvedValue({
        id: "1",
        name: "Test",
        email: "test@test.com",
        phone: "123",
        businessName: "Biz",
        slug: "test",
        role: "USER",
        plan: "FREE",
        createdAt: new Date("2023-01-01"),
      } as any);

      const result = await service.me("1");
      expect(result).toEqual({
        id: "1",
        name: "Test",
        email: "test@test.com",
        phone: "123",
        businessName: "Biz",
        slug: "test",
        role: "USER",
        plan: "FREE",
        createdAt: new Date("2023-01-01"),
      });
    });
  });

  describe("updateProfile", () => {
    it("should throw NotFoundException if user not found during update", async () => {
      repository.update.mockResolvedValue(null);
      await expect(service.updateProfile("invalid-id", {})).rejects.toThrow(NotFoundException);
    });

    it("should return updated user data", async () => {
      repository.update.mockResolvedValue({
        id: "1",
        name: "Updated",
        email: "test@test.com",
        phone: "123",
        businessName: "Biz",
        slug: "test",
        role: "USER",
        plan: "FREE",
        createdAt: new Date("2023-01-01"),
      } as any);

      const result = await service.updateProfile("1", { name: "Updated" });
      expect(result.name).toBe("Updated");
      expect(repository.update).toHaveBeenCalledWith("1", { name: "Updated" });
    });
  });
});
