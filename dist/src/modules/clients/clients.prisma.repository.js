"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let ClientsPrismaRepository = class ClientsPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findManyByUserId(userId) {
        return this.prisma.client.findMany({ where: { userId } });
    }
    async findByEmailAndUserId(email, userId) {
        return this.prisma.client.findFirst({ where: { email, userId } });
    }
    async create(userId, input) {
        return this.prisma.client.create({
            data: {
                userId,
                name: input.name,
                phone: input.phone,
                email: input.email,
            },
        });
    }
    async update(id, userId, input) {
        const existing = await this.prisma.client.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            return null;
        }
        return this.prisma.client.update({
            where: { id },
            data: input,
        });
    }
    async delete(id, userId) {
        const existing = await this.prisma.client.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            return;
        }
        await this.prisma.client.delete({ where: { id } });
    }
};
exports.ClientsPrismaRepository = ClientsPrismaRepository;
exports.ClientsPrismaRepository = ClientsPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsPrismaRepository);
//# sourceMappingURL=clients.prisma.repository.js.map