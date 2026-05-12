import { ConsoleLogger, Injectable, LogLevel } from "@nestjs/common";
import { RequestContext } from "./request-context";
import { LOGGING_CONFIG } from "./logging.config";

@Injectable()
export class LoggingService extends ConsoleLogger {
  constructor(private readonly requestContext: RequestContext) {
    super();
  }

  private get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  }

  private get isTest(): boolean {
    return process.env.NODE_ENV === "test";
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "\x1b[35m◇\x1b[0m";
      case "verbose":
        return "\x1b[36m◎\x1b[0m";
      case "log":
        return "\x1b[32m✓\x1b[0m";
      case "warn":
        return "\x1b[33m⚠\x1b[0m";
      case "error":
        return "\x1b[31m✖\x1b[0m";
      default:
        return "•";
    }
  }

  private formatTimestamp(iso: string): string {
    if (this.isProduction) return iso;
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
  }

  private maskValue(key: string, value: unknown): unknown {
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.map((item) => this.maskValue("", item));
      }
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = this.maskValue(k, v);
      }
      return result;
    }

    if (LOGGING_CONFIG.SENSITIVE_KEYS.has(key.toLowerCase())) {
      return LOGGING_CONFIG.MASK_VALUE;
    }

    return value;
  }

  maskSensitive(obj: unknown): unknown {
    return this.maskValue("", obj);
  }

  private truncateBody(body: unknown): unknown {
    if (typeof body === "string" && body.length > LOGGING_CONFIG.MAX_PAYLOAD_SIZE) {
      return body.slice(0, LOGGING_CONFIG.MAX_PAYLOAD_SIZE) + `...[truncated ${body.length - LOGGING_CONFIG.MAX_PAYLOAD_SIZE} chars]`;
    }

    if (Buffer.isBuffer(body)) {
      return `[Buffer: ${body.length} bytes]`;
    }

    if (body && typeof body === "object") {
      try {
        const str = JSON.stringify(body);
        if (str.length > LOGGING_CONFIG.MAX_PAYLOAD_SIZE) {
          return JSON.parse(str.slice(0, LOGGING_CONFIG.MAX_PAYLOAD_SIZE) + `"...}[truncated]`);
        }
      } catch {
        return "[unserializable payload]";
      }
    }

    return body;
  }

  private safeStringify(obj: unknown, indent?: number): string {
    try {
      const masked = this.maskSensitive(obj);
      const truncated = this.truncateBody(masked);
      if (typeof truncated === "string") return truncated;
      return JSON.stringify(truncated, null, indent);
    } catch {
      return "[unserializable]";
    }
  }

  logRequest(entry: {
    method: string;
    url: string;
    routeParams: Record<string, string | string[]>;
    queryParams: Record<string, unknown>;
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    clientIp: string;
    userAgent: string;
  }): void {
    if (this.isTest) return;

    const ctx = this.requestContext.getContext();
    const correlationId = ctx?.correlationId ?? "no-id";
    const timestamp = new Date().toISOString();

    if (this.isProduction) {
      const maskedHeaders: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(entry.headers)) {
        maskedHeaders[k] = LOGGING_CONFIG.SENSITIVE_HEADERS.has(k.toLowerCase())
          ? LOGGING_CONFIG.MASK_VALUE
          : v;
      }

      process.stdout.write(
        JSON.stringify({
          level: "info",
          type: "request",
          correlationId,
          timestamp,
          method: entry.method,
          url: entry.url,
          routeParams: entry.routeParams,
          query: entry.queryParams,
          body: this.maskSensitive(this.truncateBody(entry.body)),
          headers: maskedHeaders,
          clientIp: entry.clientIp,
          userAgent: entry.userAgent,
          userId: ctx?.userId,
          businessId: ctx?.businessId,
        }) + "\n",
      );
    } else {
      const emoji = this.getLevelEmoji("log");
      const time = this.formatTimestamp(timestamp);
      const id = correlationId.slice(0, 8);

      process.stdout.write(
        `\n${emoji} \x1b[1m${entry.method}\x1b[0m ${entry.url} \x1b[90m[${id}]\x1b[0m ${time}\n`,
      );

      if (ctx?.userId) {
        process.stdout.write(`  \x1b[90muser:\x1b[0m ${ctx.userId}${ctx.userEmail ? ` (${ctx.userEmail})` : ""}\n`);
      }
      if (ctx?.businessId) {
        process.stdout.write(`  \x1b[90mbusiness:\x1b[0m ${ctx.businessId}\n`);
      }

      process.stdout.write(`  \x1b[90mip:\x1b[0m ${entry.clientIp}  \x1b[90mua:\x1b[0m ${entry.userAgent.slice(0, 80)}\n`);

      if (Object.keys(entry.routeParams).length) {
        process.stdout.write(`  \x1b[90mparams:\x1b[0m ${this.safeStringify(entry.routeParams)}\n`);
      }
      if (Object.keys(entry.queryParams).length) {
        process.stdout.write(`  \x1b[90mquery:\x1b[0m ${this.safeStringify(entry.queryParams)}\n`);
      }
      if (entry.body && typeof entry.body === "object" && Object.keys(entry.body as object).length) {
        // Use 2-space indent for dev readability, but wrap in grey
        const bodyJson = this.safeStringify(entry.body, 2);
        const lines = bodyJson.split("\n");
        for (const line of lines) {
          process.stdout.write(`  \x1b[90m│\x1b[0m ${line}\n`);
        }
      }
    }
  }

  logResponse(entry: {
    method: string;
    url: string;
    statusCode: number;
    responseBody: unknown;
    durationMs: number;
    responseSizeBytes: number;
  }): void {
    if (this.isTest) return;

    const ctx = this.requestContext.getContext();
    const correlationId = ctx?.correlationId ?? "no-id";
    const timestamp = new Date().toISOString();

    const statusStr = String(entry.statusCode);
    const isError = entry.statusCode >= 400;
    const level: LogLevel = entry.statusCode >= 500 ? "error" : entry.statusCode >= 400 ? "warn" : "log";

    if (this.isProduction) {
      process.stdout.write(
        JSON.stringify({
          level,
          type: "response",
          correlationId,
          timestamp,
          method: entry.method,
          url: entry.url,
          statusCode: entry.statusCode,
          durationMs: entry.durationMs,
          responseSizeBytes: entry.responseSizeBytes,
          responseBody: entry.statusCode < 400
            ? this.maskSensitive(this.truncateBody(entry.responseBody))
            : undefined,
          userId: ctx?.userId,
          businessId: ctx?.businessId,
        }) + "\n",
      );
    } else {
      const emoji = this.getLevelEmoji(level);
      const time = this.formatTimestamp(timestamp);
      const id = correlationId.slice(0, 8);
      const colorFn = isError ? "\x1b[31m" : "\x1b[32m";

      process.stdout.write(
        `${emoji} \x1b[1m${entry.method}\x1b[0m ${entry.url} ${colorFn}${statusStr}\x1b[0m \x1b[33m${entry.durationMs}ms\x1b[0m \x1b[90m${entry.responseSizeBytes}B\x1b[0m \x1b[90m[${id}]\x1b[0m ${time}\n`,
      );

      // Show response body in dev for errors and small success responses
      if (isError && entry.responseBody) {
        const bodyStr = this.safeStringify(entry.responseBody, 2);
        const lines = bodyStr.split("\n");
        for (const line of lines) {
          process.stdout.write(`  \x1b[31m│\x1b[0m ${line}\n`);
        }
      }

      if (entry.durationMs > 1000) {
        process.stdout.write(`  \x1b[33m⚠ slow request (${entry.durationMs}ms)\x1b[0m\n`);
      }
    }
  }

  logError(entry: {
    method: string;
    url: string;
    statusCode: number;
    error: { name: string; message: string; stack?: string; code?: string };
    durationMs: number;
  }): void {
    if (this.isTest) return;

    const ctx = this.requestContext.getContext();
    const correlationId = ctx?.correlationId ?? "no-id";
    const timestamp = new Date().toISOString();

    if (this.isProduction) {
      process.stdout.write(
        JSON.stringify({
          level: "error",
          type: "error",
          correlationId,
          timestamp,
          method: entry.method,
          url: entry.url,
          statusCode: entry.statusCode,
          durationMs: entry.durationMs,
          error: {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
            code: entry.error.code,
          },
          userId: ctx?.userId,
          businessId: ctx?.businessId,
        }) + "\n",
      );
    } else {
      const id = correlationId.slice(0, 8);
      const time = this.formatTimestamp(timestamp);

      process.stdout.write(
        `\n${this.getLevelEmoji("error")} \x1b[1;31mERROR\x1b[0m ${entry.method} ${entry.url} \x1b[31m${entry.statusCode}\x1b[0m \x1b[33m${entry.durationMs}ms\x1b[0m \x1b[90m[${id}]\x1b[0m ${time}\n`,
      );
      process.stdout.write(`  \x1b[31m${entry.error.name}:\x1b[0m ${entry.error.message}\n`);
      if (entry.error.code) {
        process.stdout.write(`  \x1b[90mcode:\x1b[0m ${entry.error.code}\n`);
      }
      if (entry.error.stack) {
        const stackLines = entry.error.stack.split("\n");
        for (const line of stackLines.slice(0, 8)) {
          process.stdout.write(`  \x1b[90m${line.trim()}\x1b[0m\n`);
        }
        if (stackLines.length > 8) {
          process.stdout.write(`  \x1b[90m... ${stackLines.length - 8} more stack frames\x1b[0m\n`);
        }
      }
      process.stdout.write("\n");
    }
  }

  override log(message: string, ...optionalParams: unknown[]): void {
    this.writeFormatted("log", message, optionalParams);
  }

  override error(message: string, ...optionalParams: unknown[]): void {
    this.writeFormatted("error", message, optionalParams);
  }

  override warn(message: string, ...optionalParams: unknown[]): void {
    this.writeFormatted("warn", message, optionalParams);
  }

  override debug(message: string, ...optionalParams: unknown[]): void {
    this.writeFormatted("debug", message, optionalParams);
  }

  override verbose(message: string, ...optionalParams: unknown[]): void {
    this.writeFormatted("verbose", message, optionalParams);
  }

  private writeFormatted(level: LogLevel, message: string, params: unknown[]): void {
    if (this.isTest) return;

    const ctx = this.requestContext.getContext();
    const correlationId = ctx?.correlationId ?? "no-id";
    const timestamp = new Date().toISOString();

    const context = params.length > 0 ? params[params.length - 1] : undefined;
    const contextStr = typeof context === "string" ? context : "";

    if (this.isProduction) {
      process.stdout.write(
        JSON.stringify({
          level,
          correlationId,
          timestamp,
          message,
          context: contextStr || undefined,
          userId: ctx?.userId,
          businessId: ctx?.businessId,
        }) + "\n",
      );
    } else {
      const emoji = this.getLevelEmoji(level);
      const time = this.formatTimestamp(timestamp);
      const id = correlationId.slice(0, 8);
      const ctxPart = contextStr ? ` \x1b[90m[${contextStr}]\x1b[0m` : "";
      process.stdout.write(
        `${emoji} ${message}${ctxPart} \x1b[90m[${id}]\x1b[0m ${time}\n`,
      );
    }
  }
}
