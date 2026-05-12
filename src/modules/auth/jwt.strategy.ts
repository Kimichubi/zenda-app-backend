import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const extractors = [ExtractJwt.fromAuthHeaderAsBearerToken()];

    // Only allow token via query param in non-production environments
    if (configService.get("NODE_ENV") !== "production") {
      extractors.push((req) => req.query?.token as string);
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  validate(payload: { sub: string; email: string; businessId?: string; impersonatedBusinessId?: string; impersonated?: boolean; role?: string }) {
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      businessId: payload.impersonatedBusinessId ?? payload.businessId ?? null,
      impersonatedBusinessId: payload.impersonatedBusinessId ?? null,
      isImpersonating: payload.impersonated === true,
      role: payload.role ?? null,
    };
  }
}
