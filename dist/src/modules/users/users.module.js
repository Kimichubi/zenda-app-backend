"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../infrastructure/database/database.module");
const users_controller_1 = require("./users.controller");
const users_in_memory_repository_1 = require("./users.in-memory.repository");
const users_prisma_repository_1 = require("./users.prisma.repository");
const users_repository_1 = require("./users.repository");
const users_service_1 = require("./users.service");
const isTestEnv = process.env.NODE_ENV === "test";
const repositoryProviders = isTestEnv
    ? [
        {
            provide: users_repository_1.UsersRepository,
            useExisting: users_in_memory_repository_1.UsersInMemoryRepository,
        },
    ]
    : [
        users_prisma_repository_1.UsersPrismaRepository,
        {
            provide: users_repository_1.UsersRepository,
            useExisting: users_prisma_repository_1.UsersPrismaRepository,
        },
    ];
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [users_controller_1.UsersController],
        providers: [users_service_1.UsersService, users_in_memory_repository_1.UsersInMemoryRepository, ...repositoryProviders],
        exports: [users_service_1.UsersService, users_repository_1.UsersRepository],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map