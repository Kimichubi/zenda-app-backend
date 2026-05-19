import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance, AxiosError } from "axios";
import { ABACATE_API } from "../constants/billing.constants";

export interface AbacateCreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

export interface AbacateCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  createdAt: string;
}

export interface AbacateCreateCheckoutInput {
  customerId: string;
  amount: number;
  description: string;
  returnUrl?: string;
  expiresIn?: number;
  metadata?: Record<string, unknown>;
}

export interface AbacateCheckout {
  id: string;
  url: string;
  status: string;
  expiresAt: string;
  amount: number;
  pixCode?: string;
  pixQrCode?: string;
}

export interface AbacateWebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    amount: number;
    paidAt?: string;
    pixCode?: string;
    pixQrCode?: string;
    customerId?: string;
    subscriptionId?: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
  };
  timestamp: string;
  signature: string;
}

@Injectable()
export class AbacateClient {
  private readonly logger = new Logger(AbacateClient.name);
  private readonly http: AxiosInstance;

  constructor(configService: ConfigService) {
    const baseURL = configService.get<string>("ABACATE_API_URL", ABACATE_API.BASE_URL);
    const apiKey = configService.get<string>("ABACATE_API_TOKEN", "");

    this.http = axios.create({
      baseURL,
      timeout: ABACATE_API.TIMEOUT,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    this.http.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        this.logger.error(
          `AbacatePay API error: ${error.response?.status} ${error.message}`,
          { data: error.response?.data, path: error.config?.url },
        );
        return Promise.reject(error);
      },
    );
  }

  async createCustomer(input: AbacateCreateCustomerInput): Promise<AbacateCustomer> {
    const { data } = await this.http.post("/customer/create", {
      name: input.name,
      email: input.email,
      ...(input.phone && { phone: input.phone }),
      ...(input.document && { document: input.document }),
    });
    return data;
  }

  async createCheckout(input: AbacateCreateCheckoutInput): Promise<AbacateCheckout> {
    const { data } = await this.http.post("/billing/checkout", {
      customerId: input.customerId,
      amount: input.amount,
      description: input.description,
      ...(input.returnUrl && { returnUrl: input.returnUrl }),
      ...(input.expiresIn && { expiresIn: input.expiresIn }),
      ...(input.metadata && { metadata: input.metadata }),
    });
    return data;
  }

  async getCheckout(checkoutId: string): Promise<AbacateCheckout> {
    const { data } = await this.http.get(`/billing/checkout/${checkoutId}`);
    return data;
  }

  async getPayment(paymentId: string): Promise<{ status: string; paidAt?: string; pixCode?: string }> {
    const { data } = await this.http.get(`/billing/payment/${paymentId}`);
    return data;
  }

  verifyWebhookSignature(payload: AbacateWebhookPayload, secret: string): boolean {
    if (!secret) {
      this.logger.warn("Webhook secret not configured, skipping signature verification");
      return true;
    }
    const expected = payload.signature;
    const actual = this.computeSignature(payload, secret);
    return expected === actual;
  }

  private computeSignature(payload: AbacateWebhookPayload, secret: string): string {
    const crypto = require("crypto");
    const parts = [payload.event, payload.data.id, payload.timestamp].join(".");
    return crypto.createHmac("sha256", secret).update(parts).digest("hex");
  }
}
