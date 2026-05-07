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
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { BusinessGuard } from "../../common/guards/business.guard";
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { FindClientsDto } from "./dto/find-clients.dto";

function requireBusinessId(req: any): string {
  if (!req.user?.businessId) {
    throw new BadRequestException("Nenhum negocio associado. Complete o onboarding.");
  }
  return req.user.businessId;
}

@Controller("clients")
@UseGuards(JwtAuthGuard, BusinessGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(
    @Request() req,
    @Query() dto: FindClientsDto,
  ) {
    return this.clientsService.findAll(requireBusinessId(req), dto);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateClientDto) {
    return this.clientsService.create(requireBusinessId(req), dto);
  }

  @Patch(":id")
  update(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(requireBusinessId(req), id, dto);
  }

  @Delete(":id")
  remove(@Request() req, @Param("id") id: string) {
    return this.clientsService.remove(requireBusinessId(req), id);
  }
}
