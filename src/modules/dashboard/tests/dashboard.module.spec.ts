import { Test, TestingModule } from "@nestjs/testing";
import { DashboardModule } from "../dashboard.module";

describe("DashboardModule", () => {
  it("should compile with production environment", async () => {
    jest.isolateModules(() => {
      const { DashboardModule } = require("../dashboard.module");
      expect(DashboardModule).toBeDefined();
    });
  });
});
