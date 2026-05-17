import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");
    const port = this.configService.get<number>("SMTP_PORT");
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASS");
    const from = this.configService.get<string>("SMTP_FROM");

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`Email service configured: ${host}:${port}`);
    } else if (from) {
      this.logger.warn("SMTP partially configured; emails will be logged only.");
    } else {
      this.logger.warn("SMTP not configured; emails will be logged only.");
    }
  }

  async sendMail(options: { to: string; subject: string; text: string; html?: string }): Promise<void> {
    const from = this.configService.get<string>("SMTP_FROM") || "noreply@zenda.com";

    if (!this.transporter) {
      this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject} | Text: ${options.text}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw error;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const appName = this.configService.get<string>("APP_NAME") || "Zenda";
    await this.sendMail({
      to: email,
      subject: `${appName} — Código de verificação`,
      text: `Seu código de verificação é: ${code}\n\nEste código expira em 10 minutos.`,
      html: `<p>Seu código de verificação é:</p><h1>${code}</h1><p>Este código expira em 10 minutos.</p>`,
    });
  }
}
