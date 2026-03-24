import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { Request } from "express";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      signup: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("signup", () => {
    it("should call authService.signup", async () => {
      const dto = { name: "Test", email: "test@test.com", password: "pwd" };
      const expectedResult = { user: { id: "1", name: "Test", email: "test@test.com", role: "USER", plan: "FREE" }, accessToken: "acc", refreshToken: "ref" };
      authService.signup.mockResolvedValue(expectedResult as any);

      const result = await controller.signup(dto);
      expect(authService.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("login", () => {
    it("should call authService.login", async () => {
      const dto = { email: "test@test.com", password: "pwd" };
      const expectedResult = { user: { id: "1", name: "Test", email: "test@test.com", role: "USER", plan: "FREE" }, accessToken: "acc", refreshToken: "ref" };
      authService.login.mockResolvedValue(expectedResult as any);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("validate", () => {
    it("should return valid true and userId", () => {
      const req = { user: { id: "user-id" } } as unknown as Request & { user: { id: string } };
      const result = controller.validate(req);
      expect(result).toEqual({ valid: true, userId: "user-id" });
    });
  });

  describe("refresh", () => {
    it("should call authService.refreshToken", async () => {
      const req = { user: { id: "user-id", email: "test@test.com" } } as unknown as Request & { user: { id: string; email: string } };
      const expectedResult = { user: { id: "user-id", name: "Test", email: "test@test.com", role: "USER", plan: "FREE" }, accessToken: "acc", refreshToken: "ref" };
      authService.refreshToken.mockResolvedValue(expectedResult as any);

      const result = await controller.refresh(req);
      expect(authService.refreshToken).toHaveBeenCalledWith("user-id", "test@test.com");
      expect(result).toEqual(expectedResult);
    });
  });
});
