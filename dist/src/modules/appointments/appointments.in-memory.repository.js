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
exports.AppointmentsInMemoryRepository = void 0;
const common_1 = require("@nestjs/common");
const id_factory_1 = require("../../infrastructure/database/id.factory");
const in_memory_database_service_1 = require("../../infrastructure/database/in-memory-database.service");
let AppointmentsInMemoryRepository = class AppointmentsInMemoryRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findManyByUserId(userId) {
        return this.db.appointments.filter((appointment) => appointment.userId === userId);
    }
    async findConflict(userId, date) {
        return (this.db.appointments.find((appointment) => appointment.userId === userId &&
            appointment.date.toISOString() === date.toISOString() &&
            appointment.status !== "CANCELLED") ?? null);
    }
    async create(userId, input) {
        const record = {
            id: (0, id_factory_1.makeId)(),
            userId,
            clientId: input.clientId,
            date: input.date,
            status: "CONFIRMED",
            createdAt: new Date(),
        };
        this.db.appointments.push(record);
        return record;
    }
    async updateStatus(id, userId, status) {
        const index = this.db.appointments.findIndex((appointment) => appointment.id === id && appointment.userId === userId);
        if (index < 0) {
            return null;
        }
        this.db.appointments[index].status = status;
        return this.db.appointments[index];
    }
};
exports.AppointmentsInMemoryRepository = AppointmentsInMemoryRepository;
exports.AppointmentsInMemoryRepository = AppointmentsInMemoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [in_memory_database_service_1.InMemoryDatabaseService])
], AppointmentsInMemoryRepository);
//# sourceMappingURL=appointments.in-memory.repository.js.map