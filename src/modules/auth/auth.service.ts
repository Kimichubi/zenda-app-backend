import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { UsersRepository } from "../users/users.repository";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) { }

  async signup(dto: SignupDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const slug = dto.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone ?? "",
      businessName: dto.businessName ?? dto.name,
      slug,
    });

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.plan, (user as any).businessId);
  }

  async login(dto: LoginDto) {
    const user = await this.validateCredentials(dto.email, dto.password);
    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.plan, (user as any).businessId);
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
      throw new UnauthorizedException();
    }
    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.plan, (user as any).businessId);
  }

  buildAuthResponse(userId: string, email: string, name: string, role: string, plan: string, businessId?: string, rememberMe?: boolean) {
    const payload: Record<string, unknown> = { sub: userId, email };
    if (businessId) payload.businessId = businessId;

    const accessExpiry = rememberMe ? "30d" : "15m";
    const refreshExpiry = rememberMe ? "30d" : "7d";

    const accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiry });
    const refreshToken = this.jwtService.sign(
      { sub: userId, email, tokenType: "refresh" },
      { expiresIn: refreshExpiry },
    );

    return {
      user: { id: userId, name, email, role, plan },
      accessToken,
      refreshToken,
    };
  }
}
