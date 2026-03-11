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
exports.SchedulesService = void 0;
const common_1 = require("@nestjs/common");
const in_memory_database_service_1 = require("../../infrastructure/database/in-memory-database.service");
const id_factory_1 = require("../../infrastructure/database/id.factory");
let SchedulesService = class SchedulesService {
    db;
    constructor(db) {
        this.db = db;
    }
    list(userId) {
        return this.db.schedules.filter((item) => item.userId === userId);
    }
    upsert(userId, dto) {
        const existing = this.db.schedules.find((schedule) => schedule.userId === userId && schedule.weekday === dto.weekday);
        if (existing) {
            existing.startTime = dto.startTime;
            existing.endTime = dto.endTime;
            return existing;
        }
        const schedule = {
            id: (0, id_factory_1.makeId)(),
            userId,
            weekday: dto.weekday,
            startTime: dto.startTime,
            endTime: dto.endTime,
        };
        this.db.schedules.push(schedule);
        return schedule;
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [in_memory_database_service_1.InMemoryDatabaseService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map