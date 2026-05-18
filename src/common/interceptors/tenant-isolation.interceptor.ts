import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class TenantIsolationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    if (user.role === "PLATFORM_ADMIN") {
      return next.handle();
    }

    if (user.businessId && request.params?.businessId && request.params.businessId !== user.businessId) {
      throw new ForbiddenException("Acesso negado a dados de outro negocio");
    }

    const body = request.body;
    if (body && typeof body === "object" && "businessId" in body && body.businessId !== user.businessId) {
      throw new ForbiddenException("Nao e permitido acessar dados de outro negocio");
    }

    return next.handle();
  }
}
