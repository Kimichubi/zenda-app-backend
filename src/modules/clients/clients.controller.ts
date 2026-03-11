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
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

@Controller("clients")
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.clientsService.findAll(user.sub);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.sub, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.sub, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.clientsService.remove(user.sub, id);
  }
}
