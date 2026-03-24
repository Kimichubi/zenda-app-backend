import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "../jwt.strategy";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("test-secret"),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return user object from payload", () => {
      const payload = { sub: "user-id", email: "test@test.com" };
      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: "user-id",
        sub: "user-id",
        email: "test@test.com",
      });
    });
  });
});
