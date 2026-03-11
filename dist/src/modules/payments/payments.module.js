"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../infrastructure/database/database.module");
const payments_controller_1 = require("./payments.controller");
const payments_in_memory_repository_1 = require("./payments.in-memory.repository");
const payments_prisma_repository_1 = require("./payments.prisma.repository");
const payments_repository_1 = require("./payments.repository");
const payments_service_1 = require("./payments.service");
const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
    ? [
        {
            provide: payments_repository_1.PaymentsRepository,
            useExisting: payments_in_memory_repository_1.PaymentsInMemoryRepository,
        },
    ]
    : [
        payments_prisma_repository_1.PaymentsPrismaRepository,
        {
            provide: payments_repository_1.PaymentsRepository,
            useExisting: payments_prisma_repository_1.PaymentsPrismaRepository,
        },
    ];
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [payments_controller_1.PaymentsController],
        providers: [
            payments_service_1.PaymentsService,
            payments_in_memory_repository_1.PaymentsInMemoryRepository,
            ...repositoryProviders,
        ],
        exports: [payments_service_1.PaymentsService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map