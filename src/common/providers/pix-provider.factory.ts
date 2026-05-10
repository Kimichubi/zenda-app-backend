import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PixProvider } from "../interfaces/pix-provider.interface";
import { BrcodePixProvider } from "./brcode-pix.provider";

export type PixProviderType = "brcode" | "mercadopago" | "asaas" | "stripe" | "pagarme" | "gerencianet";

@Injectable()
export class PixProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly brcodeProvider: BrcodePixProvider,
  ) {}

  create(providerType?: PixProviderType): PixProvider {
    const type = providerType || (this.configService.get("PIX_PROVIDER") as PixProviderType) || "brcode";
    return this.getProvider(type);
  }

  private getProvider(type: PixProviderType): PixProvider {
    switch (type) {
      case "brcode":
        return this.brcodeProvider;
      case "mercadopago":
      case "asaas":
      case "stripe":
      case "pagarme":
      case "gerencianet":
        throw new Error(`Provider ${type} is not yet implemented. Configured as future integration.`);
      default:
        return this.brcodeProvider;
    }
  }
}
