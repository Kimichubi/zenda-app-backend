import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>("WHATSAPP_BASE_URL") ?? "http://localhost:3001";
    this.apiKey = this.configService.get<string>("WAHA_API_KEY");
    this.logger.log(`WhatsApp Service configurado para: ${this.baseUrl} (API Key: ${this.apiKey ? 'SIM' : 'NÃO'})`);
  }

  private getHeaders() {
    return this.apiKey ? { "X-Api-Key": this.apiKey } : {};
  }

  async getSessionStatus(userId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/sessions/default`, {
        headers: this.getHeaders(),
      });
      return response.data.status;
    } catch (error) {
      if (error.response?.status === 401) {
        this.logger.error(`Erro 401 ao checar status no WAHA. Verifique a WAHA_API_KEY.`, error.response.data);
      }
      return "NOT_FOUND";
    }
  }

  async startSession(userId: string) {
    try {
      this.logger.log(`Tentando criar sessão no WAHA: default (para o usuário ${userId})`);
      await axios.post(`${this.baseUrl}/api/sessions`, {
        name: "default",
        config: {
          proxy: null,
          noweb: {},
        },
      }, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      return { status: "STARTING" };
    } catch (error) {
      const status = error.response?.status;
      const detail = JSON.stringify(error.response?.data || error.message);
      this.logger.error(`Erro ${status} ao iniciar sessão no WAHA para default: ${detail}`);
      return { status: "ERROR", detail };
    }
  }

  async getQRCode(userId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/sessions/default/qr`, {
        headers: this.getHeaders(),
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data, "binary").toString("base64");
    } catch (error) {
      this.logger.warn(`Não foi possível obter QR Code para default (Sessão pode não estar em SCANNING)`);
      return null;
    }
  }

  async logoutSession(userId: string) {
    try {
      await axios.post(`${this.baseUrl}/api/sessions/default/logout`, {}, {
        headers: this.getHeaders(),
      });
      await axios.delete(`${this.baseUrl}/api/sessions/default`, {
        headers: this.getHeaders(),
      });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async sendMessage(userId: string, phone: string, text: string): Promise<void> {
    const cleanPhone = this.formatPhoneNumber(phone);
    try {
      await axios.post(
        `${this.baseUrl}/api/sendText`,
        {
          chatId: `${cleanPhone}@c.us`,
          text: text,
          session: "default",
        },
        { headers: this.getHeaders() }
      );
      this.logger.log(`WhatsApp via WAHA (Sessão: default) enviado para ${cleanPhone}`);
    } catch (error: any) {
      this.logger.error(`Erro ao enviar mensagem via WAHA para ${cleanPhone}: ${error.message}`);
    }
  }

  async sendConfirmation(
    userId: string,
    phone: string,
    data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      businessName: string;
    }
  ): Promise<void> {
    const message = `Olá *${data.clientName}*! 🌟\n\nConfirmamos seu agendamento de *${data.serviceName}*.\n\n📅 *Data:* ${data.date}\n⏰ *Hora:* ${data.time}\n🏢 *Local:* ${data.businessName}\n\nEstamos te esperando!`;
    return this.sendMessage(userId, phone, message);
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  }
}