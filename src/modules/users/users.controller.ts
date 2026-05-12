import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get("me")
  me(@Req() req: Request & { user: { id: string; isImpersonating?: boolean; impersonatedBusinessId?: string; businessId?: string } }) {
    return this.usersService.me(req.user.id, {
      isImpersonating: req.user.isImpersonating ?? false,
      impersonatedBusinessId: req.user.impersonatedBusinessId ?? null,
      businessId: req.user.businessId ?? null,
    });
  }

  @Patch("me")
  updateProfile(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
