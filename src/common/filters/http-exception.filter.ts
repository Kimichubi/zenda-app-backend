import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const method = request?.method ?? "UNKNOWN";
    const url = request?.url ?? "UNKNOWN";

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${method} ${url} - ${status}\n${stack}`);
    } else if (status >= 400) {
      this.logger.warn(
        `${method} ${url} - ${status} - ${this.extractMessage(exception)}`,
      );
    }

    let responseBody: Record<string, unknown>;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      responseBody = {
        ...(typeof exceptionResponse === "object"
          ? exceptionResponse
          : { message: String(exceptionResponse) }),
        timestamp: new Date().toISOString(),
        path: url,
      };
    } else {
      responseBody = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
        timestamp: new Date().toISOString(),
        path: url,
      };
    }

    response.status(status).json(responseBody);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === "object" && res !== null && "message" in res) {
        return Array.isArray(res.message)
          ? res.message.join(", ")
          : String(res.message);
      }
      return exception.message;
    }
    return String(exception);
  }
}