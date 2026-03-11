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
});

export type EnvSchema = z.infer<typeof envSchema>;
