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
exports.UsersInMemoryRepository = void 0;
const common_1 = require("@nestjs/common");
const id_factory_1 = require("../../infrastructure/database/id.factory");
const in_memory_database_service_1 = require("../../infrastructure/database/in-memory-database.service");
let UsersInMemoryRepository = class UsersInMemoryRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(input) {
        const record = {
            id: (0, id_factory_1.makeId)(),
            name: input.name,
            email: input.email,
            passwordHash: input.passwordHash,
            createdAt: new Date(),
        };
        this.db.users.push(record);
        return record;
    }
    async findByEmail(email) {
        return this.db.users.find((u) => u.email === email) ?? null;
    }
    async findById(id) {
        return this.db.users.find((u) => u.id === id) ?? null;
    }
};
exports.UsersInMemoryRepository = UsersInMemoryRepository;
exports.UsersInMemoryRepository = UsersInMemoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [in_memory_database_service_1.InMemoryDatabaseService])
], UsersInMemoryRepository);
//# sourceMappingURL=users.in-memory.repository.js.map