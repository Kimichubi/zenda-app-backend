import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "./dto/create-booking.dto";

@Controller("booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Get(":slug/services")
  getServices(@Param("slug") slug: string) {
    return this.bookingService.getServices(slug);
  }

  @Get(":slug/slots")
  getAvailableSlots(
    @Param("slug") slug: string,
    @Query("date") date: string,
    @Query("serviceId") serviceId: string,
    @Query("professionalId") professionalId?: string,
  ) {
    if (!date || !serviceId) {
      throw new NotFoundException("date and serviceId query params are required");
    }
    return this.bookingService.getAvailableSlots(slug, date, serviceId, professionalId);
  }

  @Get(":slug/today")
  getTodaySlots(@Param("slug") slug: string) {
    return this.bookingService.getTodaySlots(slug);
  }

  @Post(":slug")
  createBooking(
    @Param("slug") slug: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.createBooking(slug, dto);
  }
}
