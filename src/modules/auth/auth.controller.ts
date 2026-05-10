import { Body, Controller, Get, Post, Patch, Req, UseGuards, Logger, UnauthorizedException, Headers } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("login")
  async login(@Body() body: any) {
    const user = await this.authService.validateCredentials(body.email, body.password);

    const code = this.generateCode();
    await this.prisma.verificationCode.create({
      data: {
        email: user.email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    this.logger.log(`[2FA] Code sent to ${user.email}`);

    return {
      requires2FA: true,
      email: this.maskEmail(user.email),
      message: "Um codigo de verificacao foi enviado para seu email.",
      rememberMe: body.rememberMe === true,
    };
  }

  @Post("verify-login-code")
  async verifyLoginCode(@Body() body: { email: string; code: string; rememberMe?: boolean }) {
    const user = await this.usersRepository.findByEmail(body.email);
    if (!user) {
      return { valid: false, message: "Email nao encontrado." };
    }

    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        code: body.code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return { valid: false, message: "Codigo invalido ou expirado." };
    }

    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { used: true },
    });

    return this.authService.buildAuthResponse(
      user.id, user.email, user.name, user.role, (user as any).businessId, body.rememberMe,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("validate")
  async validate(@Req() req: Request & { user: { id: string } }) {
    const user = await this.usersRepository.findById(req.user.id);
    if (!user) {
      return { valid: false };
    }

    const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

    if (isPlatformAdmin) {
      return {
        valid: true,
        userId: user.id,
        businessId: null,
        businessName: "Zenda Platform",
        businessStatus: null,
        role: user.role,
        needsOnboarding: false,
        suspended: false,
      };
    }

    const hasBusiness = !!user.businessId;
    let businessStatus: string | null = null;
    let businessName: string | null = null;

    if (hasBusiness) {
      const business = await this.prisma.business.findUnique({
        where: { id: user.businessId! },
        select: { status: true, name: true },
      });
      if (business) {
        businessStatus = business.status;
        businessName = business.name;
      }
    }

    const needsOnboarding = !hasBusiness || businessStatus === "PENDING";
    const suspended = businessStatus === "SUSPENDED";

    return {
      valid: true,
      userId: req.user.id,
      businessId: user.businessId ?? null,
      businessName,
      businessStatus,
      role: user.role,
      needsOnboarding,
      suspended,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("complete-onboarding")
  async completeOnboarding(@Req() req: Request & { user: { id: string } }) {
    return { success: true, message: "Sua conta sera ativada em breve pela equipe de suporte." };
  }

  @Post("refresh")
  async refresh(@Headers("authorization") authHeader?: string) {
    const oldRefreshToken = authHeader?.replace("Bearer ", "");

    if (!oldRefreshToken) {
      throw new UnauthorizedException("Token nao fornecido");
    }

    return this.authService.rotateRefreshToken(oldRefreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: Request & { user: { id: string } }) {
    await this.authService.revokeAllUserTokens(req.user.id);
    return { success: true, message: "Sessao encerrada com sucesso" };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split("@");
    const masked = name.charAt(0) + "***" + name.charAt(name.length - 1);
    return `${masked}@${domain}`;
  }
}
