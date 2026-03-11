import { z } from "zod";
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        test: "test";
        development: "development";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    JWT_ACCESS_SECRET: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_SECRET: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    REDIS_URL: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type EnvSchema = z.infer<typeof envSchema>;
