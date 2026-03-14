import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("validate")
  validate(@Req() req: Request & { user: { sub: string } }) {
    return { valid: true, userId: req.user.sub };
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  refresh(@Req() req: Request & { user: { sub: string; email: string } }) {
    return this.authService.refreshToken(req.user.sub, req.user.email);
  }
}
