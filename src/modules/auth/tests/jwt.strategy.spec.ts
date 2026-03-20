import { Test, TestingModule } from "@nestjs/testing";
import { JwtStrategy } from "../jwt.strategy";
import { ConfigService } from "@nestjs/config";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;

  const createStrategy = async (secretValue: string | null) => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === "JWT_ACCESS_SECRET") return secretValue;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    return module.get<JwtStrategy>(JwtStrategy);
  };

  it("should be defined with config secret", async () => {
    strategy = await createStrategy("my-secret");
    expect(strategy).toBeDefined();
  });

  it("should be defined with fallback secret", async () => {
    strategy = await createStrategy(null);
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    beforeEach(async () => {
      strategy = await createStrategy("secret");
    });

    it("should return id and email", () => {
      const payload = { sub: "user-id", email: "test@test.com" };
      const result = strategy.validate(payload);
      expect(result).toEqual({ id: "user-id", email: "test@test.com" });
    });
  });
});
