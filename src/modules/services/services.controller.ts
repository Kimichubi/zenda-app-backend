import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
  Request,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { ServicesService } from "./services.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { FindServicesDto } from "./dto/find-services.dto";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("services")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Get()
  findAll(
    @Request() req,
    @Query() dto: FindServicesDto,
  ) {
    return this.servicesService.findAll(requireBusinessId(req), dto);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(requireBusinessId(req), dto);
  }

  @Patch(":id")
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(requireBusinessId(req), id, dto);
  }

  @Delete(":id")
  remove(@Request() req, @Param("id") id: string) {
    return this.servicesService.remove(requireBusinessId(req), id);
  }
}
