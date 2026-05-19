import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers["idempotency-key"] ?? null;
  },
);
