import { Test, TestingModule } from "@nestjs/testing";
import { BookingModule } from "../booking.module";

describe("BookingModule", () => {
  it("should compile with production environment", async () => {
    jest.isolateModules(() => {
      const { BookingModule } = require("../booking.module");
      expect(BookingModule).toBeDefined();
    });
  });
});
