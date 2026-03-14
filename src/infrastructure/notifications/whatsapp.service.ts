import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly phoneNumberId: string | undefined;
  private readonly accessToken: string | undefined;
  private readonly apiVersion: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = this.configService.get<string>("WA_PHONE_NUMBER_ID");
    this.accessToken = this.configService.get<string>("WA_ACCESS_TOKEN");
    this.apiVersion = this.configService.get<string>("WA_API_VERSION") || "v18.0";
    
    this.isConfigured = !!(this.phoneNumberId && this.accessToken);
    
    if (!this.isConfigured) {
      this.logger.warn("WhatsApp API não configurada. O serviço funcionará em modo de SIMULAÇÃO (apenas logs).");
    }
  }

  async sendConfirmation(
    phone: string,
    data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      businessName: string;
    }
  ): Promise<void> {
    const message = `Olá ${data.clientName}! 🌟\n\nConfirmamos seu agendamento de *${data.serviceName}*.\n\n📅 *Data:* ${data.date}\n⏰ *Hora:* ${data.time}\n🏢 *Local:* ${data.businessName}\n\nEstamos te esperando!`;
    
    const cleanPhone = this.formatPhoneNumber(phone);

    if (!this.isConfigured || !this.phoneNumberId || !this.accessToken) {
      this.logger.log(`[SIMULAÇÃO WHATSAPP] Para: ${cleanPhone}\nMensagem: ${message}`);
      return;
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      this.logger.log(`WhatsApp enviado com sucesso para ${cleanPhone}`);
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      this.logger.error(`Erro ao enviar WhatsApp para ${cleanPhone}:`, JSON.stringify(errorData));
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  }
}
