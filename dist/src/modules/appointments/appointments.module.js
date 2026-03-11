"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../infrastructure/database/database.module");
const appointments_controller_1 = require("./appointments.controller");
const appointments_in_memory_repository_1 = require("./appointments.in-memory.repository");
const appointments_prisma_repository_1 = require("./appointments.prisma.repository");
const appointments_repository_1 = require("./appointments.repository");
const appointments_service_1 = require("./appointments.service");
const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
    ? [
        {
            provide: appointments_repository_1.AppointmentsRepository,
            useExisting: appointments_in_memory_repository_1.AppointmentsInMemoryRepository,
        },
    ]
    : [
        appointments_prisma_repository_1.AppointmentsPrismaRepository,
        {
            provide: appointments_repository_1.AppointmentsRepository,
            useExisting: appointments_prisma_repository_1.AppointmentsPrismaRepository,
        },
    ];
let AppointmentsModule = class AppointmentsModule {
};
exports.AppointmentsModule = AppointmentsModule;
exports.AppointmentsModule = AppointmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [appointments_controller_1.AppointmentsController],
        providers: [
            appointments_service_1.AppointmentsService,
            appointments_in_memory_repository_1.AppointmentsInMemoryRepository,
            ...repositoryProviders,
        ],
        exports: [appointments_repository_1.AppointmentsRepository, appointments_service_1.AppointmentsService],
    })
], AppointmentsModule);
//# sourceMappingURL=appointments.module.js.map