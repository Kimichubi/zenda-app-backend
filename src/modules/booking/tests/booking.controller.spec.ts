import { Test, TestingModule } from "@nestjs/testing";
import { BookingController } from "../booking.controller";
import { BookingService } from "../booking.service";
import { NotFoundException } from "@nestjs/common";

describe("BookingController", () => {
  let controller: BookingController;
  let service: BookingService;

  beforeEach(async () => {
    const mockService = {
      getServices: jest.fn().mockResolvedValue([]),
      getAvailableSlots: jest.fn().mockResolvedValue([]),
      createBooking: jest.fn().mockResolvedValue({ message: "Booking created successfully" }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: BookingService, useValue: mockService },
      ],
    }).compile();

    controller = moduleRef.get(BookingController);
    service = moduleRef.get(BookingService);
  });

  it("should get services", async () => {
    const result = await controller.getServices("slug");
    expect(result).toEqual([]);
    expect(service.getServices).toHaveBeenCalledWith("slug");
  });

  it("should get available slots", async () => {
    const result = await controller.getAvailableSlots("slug", "2023-01-01", "s1");
    expect(result).toEqual([]);
    expect(service.getAvailableSlots).toHaveBeenCalledWith("slug", "2023-01-01", "s1");
  });

  it("should throw error if date or serviceId is missing", () => {
    expect(() => controller.getAvailableSlots("slug", "", "s1")).toThrow(NotFoundException);
    expect(() => controller.getAvailableSlots("slug", "2023-01-01", "")).toThrow(NotFoundException);
  });

  it("should create booking", async () => {
    const dto = { serviceId: "s1", date: "2023-01-01", startTime: "10:00", clientName: "John", clientPhone: "123" };
    const result = await controller.createBooking("slug", dto);
    expect(result).toEqual({ message: "Booking created successfully" });
    expect(service.createBooking).toHaveBeenCalledWith("slug", dto);
  });
});
