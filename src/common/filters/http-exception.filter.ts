import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { LoggingService } from "../../infrastructure/logging/logging.service";
import { RequestContext } from "../../infrastructure/logging/request-context";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly requestContext: RequestContext,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const method = request?.method ?? "UNKNOWN";
    const url = request?.url ?? "UNKNOWN";

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const duration = this.requestContext.getRequestDuration();

    const errorDetail = this.extractErrorDetail(exception);

    this.loggingService.logError({
      method,
      url,
      statusCode: status,
      error: errorDetail,
      durationMs: duration ?? 0,
    });

    let responseBody: Record<string, unknown>;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      responseBody = {
        ...(typeof exceptionResponse === "object"
          ? (exceptionResponse as Record<string, unknown>)
          : { message: String(exceptionResponse) }),
        timestamp: new Date().toISOString(),
        path: url,
        correlationId: this.requestContext.getCorrelationId(),
      };
    } else {
      responseBody = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
        timestamp: new Date().toISOString(),
        path: url,
        correlationId: this.requestContext.getCorrelationId(),
      };
    }

    response.status(status).json(responseBody);
  }

  private extractErrorDetail(exception: unknown): {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  } {
    if (exception instanceof Error) {
      const ex = exception as unknown as Record<string, unknown>;
      const code = typeof ex.code === "string" ? (ex.code as string) : undefined;

      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
        code,
      };
    }

    return {
      name: "UnknownError",
      message: String(exception),
    };
  }
}
