"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: zod_1.z.coerce.number().default(3000),
    JWT_ACCESS_SECRET: zod_1.z.string().min(10).default("agendapix-access-secret"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10).default("agendapix-refresh-secret"),
    DATABASE_URL: zod_1.z
        .string()
        .url()
        .default("postgresql://postgres:postgres@localhost:5432/agendapix"),
    REDIS_URL: zod_1.z.string().url().default("redis://localhost:6379"),
});
//# sourceMappingURL=env.validation.js.map