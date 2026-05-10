export interface PixProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  providerType: string;
}

export interface PixPaymentRequest {
  amount: number;
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  description?: string;
  txid?: string;
  externalReference?: string;
}

export interface PixPaymentResponse {
  id: string;
  pixCode: string;
  qrCodeBase64?: string;
  qrCodeUrl?: string;
  status: PixPaymentStatus;
  externalId?: string;
  amount: number;
  expiresAt?: Date;
  rawResponse?: Record<string, unknown>;
}

export type PixPaymentStatus = "pending" | "paid" | "canceled" | "refunded" | "failed";

export abstract class PixProvider {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract generatePayment(request: PixPaymentRequest): Promise<PixPaymentResponse>;
  abstract checkStatus(externalId: string): Promise<{ status: PixPaymentStatus; rawResponse?: Record<string, unknown> }>;

  cancelPayment?(externalId: string): Promise<{ success: boolean; rawResponse?: Record<string, unknown> }>;
  refundPayment?(externalId: string, amount?: number): Promise<{ success: boolean; rawResponse?: Record<string, unknown> }>;
}
