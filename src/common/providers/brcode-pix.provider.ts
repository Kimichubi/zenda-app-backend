import { Injectable } from "@nestjs/common";
import { PixProvider, PixPaymentRequest, PixPaymentResponse } from "../interfaces/pix-provider.interface";
import { PixGenerator } from "../utils/pix-generator";

@Injectable()
export class BrcodePixProvider extends PixProvider {
  readonly id = "brcode";
  readonly name = "PIX (BR Code)";

  async generatePayment(request: PixPaymentRequest): Promise<PixPaymentResponse> {
    const pixCode = PixGenerator.generate({
      key: request.pixKey,
      name: request.merchantName,
      city: request.merchantCity,
      amount: request.amount,
      description: request.description,
      txid: request.txid,
    });

    return {
      id: `brcode-${Date.now()}`,
      pixCode,
      status: "pending",
      amount: request.amount,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async checkStatus(_externalId: string): Promise<{ status: "pending" | "paid" | "canceled" | "refunded" | "failed"; rawResponse?: Record<string, unknown> }> {
    return { status: "pending" };
  }
}
