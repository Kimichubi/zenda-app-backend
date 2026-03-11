"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisProvider = exports.REDIS_CLIENT = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.REDIS_CLIENT = Symbol("REDIS_CLIENT");
exports.redisProvider = {
    provide: exports.REDIS_CLIENT,
    useFactory: () => {
        const url = process.env.REDIS_URL ?? "redis://localhost:6379";
        return new ioredis_1.default(url, { maxRetriesPerRequest: null });
    },
};
//# sourceMappingURL=redis.provider.js.map