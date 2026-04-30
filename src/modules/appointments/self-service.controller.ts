import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SelfServiceService } from "./self-service.service";

@Controller("self-service")
export class SelfServiceController {
  constructor(private readonly selfService: SelfServiceService) {}

  @Get("reschedule/:token")
  async getRescheduleInfo(@Param("token") token: string) {
    const appointment = await this.selfService.validateToken(token);
    return {
      id: appointment.id,
      service: appointment.service,
      date: appointment.date,
      startTime: appointment.startTime,
      professional: appointment.user,
      client: appointment.client,
    };
  }

  @Post("reschedule/:token")
  async reschedule(
    @Param("token") token: string,
    @Body() body: { date: string; startTime: string },
  ) {
    return this.selfService.rescheduleByToken(token, body.date, body.startTime);
  }

  @Post("cancel/:token")
  async cancel(@Param("token") token: string) {
    return this.selfService.cancelByToken(token);
  }
}