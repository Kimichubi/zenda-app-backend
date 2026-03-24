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
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { FindClientsDto } from "./dto/find-clients.dto";

@Controller("clients")
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query() dto: FindClientsDto,
  ) {
    return this.clientsService.findAll(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.clientsService.remove(user.id, id);
  }
}
