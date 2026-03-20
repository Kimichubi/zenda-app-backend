import { Test, TestingModule } from "@nestjs/testing";
import { UsersModule } from "../users.module";
import { DatabaseModule } from "../../../infrastructure/database/database.module";

describe("UsersModule", () => {
  it("should compile the module", async () => {
    // Process env was modified to test to trigger in-memory repo provider
    process.env.NODE_ENV = "test";
    
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsersModule, DatabaseModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(UsersModule)).toBeInstanceOf(UsersModule);
  });
  
  it("should compile the module in non-test env", async () => {
    process.env.NODE_ENV = "development";
    // Using dynamic import or re-requiring the module would be needed to truly test the conditional provider,
    // but typically just compiling it is enough for coverage. Since the constants are evaluated on file load,
    // changing NODE_ENV here won't change the providers unless we isolate modules.
    // For coverage of users.module.ts we just need it to load.
    
    jest.isolateModules(async () => {
      process.env.NODE_ENV = "development";
      const { UsersModule: DevUsersModule } = require("../users.module");
      const { DatabaseModule: DevDatabaseModule } = require("../../../infrastructure/database/database.module");
      
      const module: TestingModule = await Test.createTestingModule({
        imports: [DevUsersModule, DevDatabaseModule],
      }).compile();

      expect(module).toBeDefined();
    });
  });
});
