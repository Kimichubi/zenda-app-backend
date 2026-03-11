import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.appointmentsService.findAll(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user.sub, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user.sub, id, dto);
  }
}
