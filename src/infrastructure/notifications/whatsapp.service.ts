import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import axios from "axios";

const DEFAULT_CONFIRMATION_TEMPLATE = `Olá *{clientName}*! 🌟\n\nConfirmamos seu agendamento de *{serviceName}*.\n\n📅 *Data:* {date}\n⏰ *Hora:* {time}\n🏢 *Local:* {businessName}\n\nEstamos te esperando!`;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
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
      const data = error.response?.data;
      
      if (status === 422 && data?.message?.includes("already exists")) {
        this.logger.log(`Sessão 'default' já existe, tentando iniciar...`);
        try {
          await axios.post(`${this.baseUrl}/api/sessions/default/start`, {}, {
            headers: this.getHeaders(),
            timeout: 10000
          });
          return { status: "STARTING" };
        } catch (startError) {
          const startDetail = JSON.stringify(startError.response?.data || startError.message);
          this.logger.error(`Erro ao tentar iniciar sessão existente: ${startDetail}`);
          return { status: "ERROR", detail: startDetail };
        }
      }

      const detail = JSON.stringify(data || error.message);
      this.logger.error(`Erro ${status} ao iniciar sessão no WAHA para default: ${detail}`);
      return { status: "ERROR", detail };
    }
  }

  async getQRCode(userId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/default/auth/qr`, {
        headers: {
          ...this.getHeaders(),
          "Accept": "application/json",
        },
      });
      return response.data.data;
    } catch (error) {
      this.logger.warn(`Não foi possível obter QR Code para default: ${error.message}`);
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
    const template = await this.getConfirmationTemplate(userId);
    const message = this.applyTemplate(template, data);
    return this.sendMessage(userId, phone, message);
  }

  async sendReminder(
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
    const template = await this.getReminderTemplate(userId);
    const message = this.applyTemplate(template, data);
    return this.sendMessage(userId, phone, message);
  }

  private async getConfirmationTemplate(userId: string): Promise<string> {
    try {
      const settings = await this.prisma.siteSettings.findUnique({
        where: { userId },
      });
      return settings?.appointmentConfirmationTemplate || DEFAULT_CONFIRMATION_TEMPLATE;
    } catch {
      return DEFAULT_CONFIRMATION_TEMPLATE;
    }
  }

  private async getReminderTemplate(userId: string): Promise<string> {
    const defaultTemplate = `Olá {clientName}, este é um lembrete do seu agendamento de {serviceName} amanhã, dia {date} às {time} com {businessName}. Responda SIM para confirmar ou NAO para cancelar.`;

    try {
      const settings = await this.prisma.siteSettings.findUnique({
        where: { userId },
      });
      return settings?.appointmentReminderTemplate || defaultTemplate;
    } catch {
      return defaultTemplate;
    }
  }

  private applyTemplate(
    template: string,
    data: {
      clientName: string;
      serviceName: string;
      date: string;
      time: string;
      businessName: string;
    }
  ): string {
    return template
      .replace(/\{clientName\}/g, data.clientName)
      .replace(/\{serviceName\}/g, data.serviceName)
      .replace(/\{date\}/g, data.date)
      .replace(/\{time\}/g, data.time)
      .replace(/\{businessName\}/g, data.businessName);
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  }
}