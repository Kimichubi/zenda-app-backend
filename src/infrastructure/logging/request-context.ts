import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { RequestContextData } from "./logging.types";

@Injectable()
export class RequestContext {
  private readonly storage = new AsyncLocalStorage<RequestContextData>();

  run(context: RequestContextData, fn: () => void): void {
    this.storage.run(context, fn);
  }

  enterWith(context: RequestContextData): void {
    this.storage.enterWith(context);
  }

  getContext(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  getCorrelationId(): string {
    return this.storage.getStore()?.correlationId ?? "no-correlation-id";
  }

  getRequestDuration(): number | undefined {
    const ctx = this.storage.getStore();
    return ctx ? Date.now() - ctx.startTime : undefined;
  }

  getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  getBusinessId(): string | undefined {
    return this.storage.getStore()?.businessId;
  }

  createContext(
    overrides?: Partial<RequestContextData>,
  ): RequestContextData {
    return {
      correlationId: randomUUID(),
      startTime: Date.now(),
      ...overrides,
    };
  }

  enrichFromRequest(req: {
    user?: { id?: string; email?: string; businessId?: string };
    headers?: Record<string, unknown>;
  }): void {
    const ctx = this.storage.getStore();
    if (ctx && req.user) {
      if (req.user.id) ctx.userId = req.user.id;
      if (req.user.email) ctx.userEmail = req.user.email;
      if (req.user.businessId) ctx.businessId = req.user.businessId;
    }
  }
}
