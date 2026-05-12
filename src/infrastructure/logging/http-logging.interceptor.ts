import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { Request, Response } from "express";
import { LoggingService } from "./logging.service";
import { RequestContext } from "./request-context";
import { LOGGING_CONFIG } from "./logging.config";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly requestContext: RequestContext,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (this.shouldSkip(request.url ?? request.path)) {
      return next.handle();
    }

    const reqWithUser = request as unknown as {
      user?: { id?: string; email?: string; businessId?: string };
      headers: Record<string, unknown>;
    };
    this.requestContext.enrichFromRequest(reqWithUser);

    const startEntry = Date.now();

    this.logRequest(request);

    return next.handle().pipe(
      tap({
        next: (body: unknown) => {
          const duration = Date.now() - startEntry;

          this.loggingService.logResponse({
            method: request.method,
            url: request.url ?? request.path,
            statusCode: response.statusCode,
            responseBody: this.isStreamingResponse(response) ? "[streaming]" : body,
            durationMs: duration,
            responseSizeBytes: this.estimateResponseSize(body),
          });
        },
      }),
      catchError((error: unknown) => {
        // Let error propagate to the global exception filter which handles logging
        return throwError(() => error);
      }),
    );
  }

  private shouldSkip(url: string): boolean {
    return LOGGING_CONFIG.SKIP_ROUTES.some(
      (route) => url === route || url.startsWith(`${route}/`),
    );
  }

  private isStreamingResponse(response: Response): boolean {
    const contentType = response.getHeader("content-type");
    if (typeof contentType === "string") {
      return (
        contentType.includes("stream") ||
        contentType.includes("octet-stream")
      );
    }
    return false;
  }

  private estimateResponseSize(body: unknown): number {
    if (body === undefined || body === null) return 0;
    if (Buffer.isBuffer(body)) return body.length;
    if (typeof body === "string") return Buffer.byteLength(body, "utf8");
    try {
      const str = JSON.stringify(body);
      return Buffer.byteLength(str, "utf8");
    } catch {
      return 0;
    }
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded)) {
      return (
        forwarded[0]?.split(",")[0]?.trim() ?? request.ip ?? "unknown"
      );
    }
    return request.ip ?? "unknown";
  }

  private logRequest(request: Request): void {
    const body = this.extractBody(request);

    this.loggingService.logRequest({
      method: request.method,
      url: request.url ?? request.path,
      routeParams: request.params ?? {},
      queryParams: (request.query as Record<string, unknown>) ?? {},
      body,
      headers: this.extractRelevantHeaders(request),
      clientIp: this.getClientIp(request),
      userAgent: (request.headers["user-agent"] as string) ?? "unknown",
    });
  }

  private extractBody(request: Request): unknown {
    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return undefined;
    }

    const rawBody = (request as unknown as Record<string, unknown>).body;

    if (!rawBody || (typeof rawBody === "object" && Object.keys(rawBody as object).length === 0)) {
      return undefined;
    }

    // For multipart/form-data, log file info instead of raw buffer
    if (request.is?.("multipart/form-data")) {
      if (typeof rawBody === "object" && rawBody !== null) {
        const summary: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rawBody as Record<string, unknown>)) {
          if (Buffer.isBuffer(value)) {
            summary[key] = `[Buffer: ${value.length} bytes]`;
          } else if (
            typeof value === "object" &&
            value !== null &&
            "buffer" in value
          ) {
            const buf = (value as Record<string, unknown>).buffer;
            summary[key] = `[File: ${(value as Record<string, unknown>).originalname ?? "unknown"}, ${Buffer.isBuffer(buf) ? buf.length : "?"} bytes]`;
          } else {
            summary[key] = value;
          }
        }
        return summary;
      }
    }

    return rawBody;
  }

  private extractRelevantHeaders(
    request: Request,
  ): Record<string, string | string[] | undefined> {
    const relevant: Record<string, string | string[] | undefined> = {};

    const headersToInclude = [
      "content-type",
      "accept",
      "origin",
      "referer",
      "x-forwarded-for",
      "x-forwarded-proto",
      "x-request-id",
      "x-correlation-id",
      "host",
    ];

    for (const header of headersToInclude) {
      const value = request.headers[header];
      if (value) {
        relevant[header] = value;
      }
    }

    return relevant;
  }
}
