import { createParamDecorator, ExecutionContext } from "@nestjs/common";

interface JwtPayload {
  sub: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): JwtPayload => {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return req.user;
  },
);
