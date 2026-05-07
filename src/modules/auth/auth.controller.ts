import { Body, Controller, Get, Post, Patch, Req, UseGuards, Logger, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import * as bcrypt from "bcrypt";

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

    if (body.rememberMe) {
      const response = this.authService.buildAuthResponse(
        user.id, user.email, user.name, user.role, (user as any).businessId, true,
      );
      return response;
    }

    const code = this.generateCode();
    await this.prisma.verificationCode.create({
      data: {
        email: user.email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    this.logger.log(`[2FA] Verification code for ${user.email}: ${code}`);

    return {
      requires2FA: true,
      email: this.maskEmail(user.email),
      message: "Um codigo de verificacao foi enviado para seu email.",
    };
  }

  @Post("admin/login")
  async adminLogin(@Body() body: { email: string; password: string }) {
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: body.email },
    });

    if (!admin) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    const isPasswordValid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return this.authService.buildAdminAuthResponse(admin.id, admin.email, admin.name);
  }

  @Post("verify-login-code")
  async verifyLoginCode(@Body() body: { email: string; code: string }) {
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
      user.id, user.email, user.name, user.role, (user as any).businessId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("validate")
  async validate(@Req() req: Request & { user: { id: string; email: string } }) {
    const user = await this.usersRepository.findById(req.user.id);
    if (user) {
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

    const admin = await this.prisma.platformAdmin.findUnique({
      where: { email: req.user.email },
    });

    if (admin) {
      return {
        valid: true,
        userId: admin.id,
        businessId: null,
        businessName: "Zenda Platform",
        businessStatus: null,
        role: "PLATFORM_ADMIN",
        needsOnboarding: false,
        suspended: false,
      };
    }

    return { valid: false };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("complete-onboarding")
  async completeOnboarding(@Req() req: Request & { user: { id: string } }) {
    return { success: true, message: "Sua conta sera ativada em breve pela equipe de suporte." };
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  refresh(@Req() req: Request & { user: { id: string; email: string } }) {
    return this.authService.refreshToken(req.user.id, req.user.email);
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
