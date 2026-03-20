import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Controller("services")
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.servicesService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.servicesService.remove(user.id, id);
  }
}