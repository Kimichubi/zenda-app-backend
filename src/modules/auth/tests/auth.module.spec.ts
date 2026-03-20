import { Test, TestingModule } from "@nestjs/testing";
import { AuthModule } from "../auth.module";
import { ConfigModule } from "@nestjs/config";
import { UsersRepository } from "../../users/users.repository";
import { PrismaService } from "../../../infrastructure/database/prisma.service";

describe("AuthModule", () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule
      ],
    })
      .overrideProvider(UsersRepository)
      .useValue({})
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
  });

  it("should compile the module", () => {
    expect(module).toBeDefined();
    expect(module.get(AuthModule)).toBeInstanceOf(AuthModule);
  });
});
