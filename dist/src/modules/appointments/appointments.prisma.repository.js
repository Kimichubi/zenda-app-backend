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
exports.AppointmentsPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let AppointmentsPrismaRepository = class AppointmentsPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findManyByUserId(userId) {
        return this.prisma.appointment.findMany({
            where: { userId },
            orderBy: { date: "asc" },
        });
    }
    async findConflict(userId, date) {
        return this.prisma.appointment.findFirst({
            where: {
                userId,
                date,
                NOT: { status: "CANCELLED" },
            },
        });
    }
    async create(userId, input) {
        return this.prisma.appointment.create({
            data: {
                userId,
                clientId: input.clientId,
                date: input.date,
                status: "CONFIRMED",
            },
        });
    }
    async updateStatus(id, userId, status) {
        const existing = await this.prisma.appointment.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            return null;
        }
        return this.prisma.appointment.update({
            where: { id },
            data: { status },
        });
    }
};
exports.AppointmentsPrismaRepository = AppointmentsPrismaRepository;
exports.AppointmentsPrismaRepository = AppointmentsPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsPrismaRepository);
//# sourceMappingURL=appointments.prisma.repository.js.map