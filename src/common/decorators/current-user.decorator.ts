import { createParamDecorator, ExecutionContext } from "@nestjs/common";

interface JwtPayload {
  id: string;
  sub: string;
  email: string;
  businessId: string | null;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): JwtPayload => {
    const req = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return req.user;
  },
);
