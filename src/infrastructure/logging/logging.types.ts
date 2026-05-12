export type LogLevel = "debug" | "log" | "warn" | "error" | "verbose";

export interface RequestLogEntry {
  correlationId: string;
  timestamp: string;
  method: string;
  url: string;
  routeParams: Record<string, string | string[]>;
  queryParams: Record<string, unknown>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
  clientIp: string;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  businessId?: string;
  startTime: number;
}

export interface ResponseLogEntry {
  correlationId: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseBody: unknown;
  durationMs: number;
  responseSizeBytes: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface RequestContextData {
  correlationId: string;
  startTime: number;
  userId?: string;
  userEmail?: string;
  businessId?: string;
}
