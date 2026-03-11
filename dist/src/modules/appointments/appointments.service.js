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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const appointments_repository_1 = require("./appointments.repository");
let AppointmentsService = class AppointmentsService {
    appointmentsRepository;
    constructor(appointmentsRepository) {
        this.appointmentsRepository = appointmentsRepository;
    }
    findAll(userId) {
        return this.appointmentsRepository.findManyByUserId(userId);
    }
    async create(userId, dto) {
        const date = new Date(dto.date);
        const conflict = await this.appointmentsRepository.findConflict(userId, date);
        if (conflict) {
            throw new common_1.ConflictException("Appointment conflict detected");
        }
        return this.appointmentsRepository.create(userId, {
            clientId: dto.clientId,
            date,
        });
    }
    async update(userId, id, dto) {
        if (!dto.status) {
            return null;
        }
        return this.appointmentsRepository.updateStatus(id, userId, dto.status);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [appointments_repository_1.AppointmentsRepository])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map