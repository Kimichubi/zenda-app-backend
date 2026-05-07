import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req.query?.token as string,
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>("JWT_ACCESS_SECRET") ??
        "agendapix-access-secret",
    });
  }

  validate(payload: { sub: string; email: string; businessId?: string }) {
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      businessId: payload.businessId ?? null,
    };
  }
}