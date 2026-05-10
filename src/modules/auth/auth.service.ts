import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { UsersRepository } from "../users/users.repository";
import { PrismaService } from "../../infrastructure/database/prisma.service";

@Injectable()
export class AuthService {
  private readonly BCRYPT_COST = 12;
  private readonly MAX_REFRESH_FAMILY_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) { }

  async signup(dto: SignupDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_COST);

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone ?? "",
    });

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, (user as any).businessId);
  }

  async login(dto: LoginDto) {
    const user = await this.validateCredentials(dto.email, dto.password);
    return this.buildAuthResponse(user.id, user.email, user.name, user.role, (user as any).businessId);
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return user;
  }

  async refreshToken(userId: string, email: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Usuario nao encontrado");
    }
    return this.buildAuthResponse(user.id, user.email, user.name, user.role, (user as any).businessId);
  }

  async rotateRefreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: { sub: string; email: string; tokenType?: string; jti?: string };
    try {
      decoded = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "agendapix-refresh-secret",
      });
    } catch {
      throw new UnauthorizedException("Token de atualizacao invalido ou expirado");
    }

    if (decoded.tokenType !== "refresh") {
      throw new UnauthorizedException("Token invalido");
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException("Token nao encontrado. Faca login novamente.");
    }

    if (storedToken.revoked) {
      // Replay attack detected - revoke entire family
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException("Token revogado por seguranca. Faca login novamente.");
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      throw new UnauthorizedException("Token expirado. Faca login novamente.");
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true, revokedAt: new Date() },
    });

    const user = await this.usersRepository.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException("Usuario nao encontrado");
    }

    return this.issueTokenPair(user.id, user.email, user.name, user.role, (user as any).businessId, storedToken.family);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  async buildAuthResponse(userId: string, email: string, name: string, role: string, businessId?: string, rememberMe?: boolean) {
    return this.issueTokenPair(userId, email, name, role, businessId);
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    name: string,
    role: string,
    businessId?: string,
    family?: string,
    rememberMe?: boolean,
  ) {
    const tokenFamily = family || crypto.randomUUID();
    const payload: Record<string, unknown> = { sub: userId, email };
    if (businessId) payload.businessId = businessId;

    const accessExpiry = rememberMe ? "30d" : "15m";
    const refreshExpiry = rememberMe ? "30d" : "7d";

    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiry });

    const jti = crypto.randomUUID();
    const refreshToken = this.jwtService.sign(
      { sub: userId, email, tokenType: "refresh", jti },
      { expiresIn: refreshExpiry, secret: process.env.JWT_REFRESH_SECRET || "agendapix-refresh-secret" },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        family: tokenFamily,
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      },
    });

    // Cleanup old expired tokens
    const cutoff = new Date(Date.now() - this.MAX_REFRESH_FAMILY_AGE_MS);
    await this.prisma.refreshToken.deleteMany({
      where: { userId, createdAt: { lt: cutoff } },
    }).catch(() => {});

    return {
      user: { id: userId, name, email, role, businessId },
      accessToken,
      refreshToken,
    };
  }
}
