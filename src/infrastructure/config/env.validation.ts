import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  JWT_ACCESS_SECRET: z.string().min(10).default("agendapix-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(10).default("agendapix-refresh-secret"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/agendapix"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  
  // WhatsApp Cloud API (Deprecated)
  WA_PHONE_NUMBER_ID: z.string().optional(),
  WA_ACCESS_TOKEN: z.string().optional(),
  WA_API_VERSION: z.string().default("v18.0"),

  // WAHA
  WHATSAPP_BASE_URL: z.string().url().default("http://localhost:3001"),
  WHATSAPP_API_KEY: z.string().optional(),
  WHATSAPP_SESSION: z.string().default("default"),
});

export type EnvSchema = z.infer<typeof envSchema>;