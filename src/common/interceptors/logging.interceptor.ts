import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request?.method ?? "UNKNOWN";
    const url = request?.url ?? "UNKNOWN";
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startedAt;
          this.logger.log(
            `${method} ${url} ${response?.statusCode ?? 200} ${duration}ms`,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - startedAt;
          const status =
            error instanceof HttpException
              ? error.getStatus()
              : 500;
          this.logger.warn(`${method} ${url} ${status} ${duration}ms`);
        },
      }),
    );
  }
}