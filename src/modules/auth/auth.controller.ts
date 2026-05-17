import { Body, Controller, Get, Post, Patch, Req, UseGuards, Logger, UnauthorizedException, Headers } from "@nestjs/common";
import { Request } from "express";
import { randomInt } from "crypto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { EmailService } from "../../infrastructure/notifications/email.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateCredentials(dto.email, dto.password);

    const code = this.generateCode();
    await this.prisma.verificationCode.create({
      data: {
        email: user.email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    this.logger.log(`[2FA] Code generated for ${user.email}`);

    try {
      await this.emailService.sendVerificationCode(user.email, code);
    } catch {
      this.logger.error(`Failed to send verification code email to ${user.email}`);
    }

    return {
      requires2FA: true,
      email: this.maskEmail(user.email),
      message: "Um codigo de verificacao foi enviado para seu email.",
      rememberMe: dto.rememberMe === true,
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
  async validate(@Req() req: Request & { user: { id: string; businessId?: string; isImpersonating?: boolean; impersonatedBusinessId?: string; role?: string } }) {
    const user = await this.usersRepository.findById(req.user.id);
    if (!user) {
      return { valid: false };
    }

    const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
    const isImpersonating = req.user.isImpersonating === true;
    const impersonatedBusinessId = req.user.impersonatedBusinessId ?? null;

    if (isPlatformAdmin && !isImpersonating) {
      return {
        valid: true,
        userId: user.id,
        businessId: null,
        impersonatedBusinessId: null,
        businessName: "Zenda Platform",
        businessStatus: null,
        role: user.role,
        isImpersonating: false,
        needsOnboarding: false,
        suspended: false,
      };
    }

    if (isImpersonating && impersonatedBusinessId) {
      const impersonatedBusiness = await this.prisma.business.findUnique({
        where: { id: impersonatedBusinessId },
        select: { status: true, name: true },
      });

      return {
        valid: true,
        userId: user.id,
        businessId: impersonatedBusinessId,
        impersonatedBusinessId,
        businessName: impersonatedBusiness?.name ?? null,
        businessStatus: impersonatedBusiness?.status ?? null,
        role: user.role,
        isImpersonating: true,
        needsOnboarding: false,
        suspended: impersonatedBusiness?.status === "SUSPENDED",
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
      impersonatedBusinessId: null,
      businessName,
      businessStatus,
      role: user.role,
      isImpersonating: false,
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

  @UseGuards(JwtAuthGuard)
  @Post("exit-impersonation")
  async exitImpersonation(@Req() req: Request & { user: { id: string; email: string; isImpersonating?: boolean } }) {
    if (!req.user.isImpersonating) {
      throw new UnauthorizedException("Voce nao esta impersonando outra conta");
    }
    return this.authService.exitImpersonation(req.user.id, req.user.email);
  }

  private generateCode(): string {
    return randomInt(100000, 999999).toString();
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split("@");
    const masked = name.charAt(0) + "***" + name.charAt(name.length - 1);
    return `${masked}@${domain}`;
  }
}
