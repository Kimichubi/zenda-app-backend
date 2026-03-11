"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../infrastructure/database/database.module");
const clients_controller_1 = require("./clients.controller");
const clients_in_memory_repository_1 = require("./clients.in-memory.repository");
const clients_prisma_repository_1 = require("./clients.prisma.repository");
const clients_repository_1 = require("./clients.repository");
const clients_service_1 = require("./clients.service");
const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
    ? [
        {
            provide: clients_repository_1.ClientsRepository,
            useExisting: clients_in_memory_repository_1.ClientsInMemoryRepository,
        },
    ]
    : [
        clients_prisma_repository_1.ClientsPrismaRepository,
        {
            provide: clients_repository_1.ClientsRepository,
            useExisting: clients_prisma_repository_1.ClientsPrismaRepository,
        },
    ];
let ClientsModule = class ClientsModule {
};
exports.ClientsModule = ClientsModule;
exports.ClientsModule = ClientsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [clients_controller_1.ClientsController],
        providers: [
            clients_service_1.ClientsService,
            clients_in_memory_repository_1.ClientsInMemoryRepository,
            ...repositoryProviders,
        ],
        exports: [clients_service_1.ClientsService, clients_repository_1.ClientsRepository],
    })
], ClientsModule);
//# sourceMappingURL=clients.module.js.map