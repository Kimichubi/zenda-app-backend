import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3001),

  // JWT - Use strong random secrets (32+ chars) in production
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5433/postgres?schema=public"),

  // Redis
  REDIS_URL: z.string().url().default("redis://localhost:6380"),

  // Frontend
  FRONTEND_URL: z.string().url().default("http://localhost:5174"),

  // PIX Provider
  PIX_PROVIDER: z
    .enum(["brcode", "mercadopago", "asaas", "stripe", "pagarme", "gerencianet"])
    .default("brcode"),

  // WhatsApp (WAHA)
  WHATSAPP_BASE_URL: z.string().url().default("http://localhost:3002"),
  WAHA_API_KEY: z.string().optional(),

  // AI Provider
  AI_PROVIDER: z.enum(["gemini", "qwen", "default"]).default("default"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_API_URL: z.string().url().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  GEMINAI_API_KEY: z.string().optional(),
  GEMINAI_MODEL: z.string().optional(),
  QWEN_API_KEY: z.string().optional(),
  QWEN_API_URL: z.string().url().optional(),
  QWEN_MODEL: z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;
