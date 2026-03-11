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
exports.ClientsInMemoryRepository = void 0;
const common_1 = require("@nestjs/common");
const id_factory_1 = require("../../infrastructure/database/id.factory");
const in_memory_database_service_1 = require("../../infrastructure/database/in-memory-database.service");
let ClientsInMemoryRepository = class ClientsInMemoryRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findManyByUserId(userId) {
        return this.db.clients.filter((client) => client.userId === userId);
    }
    async findByEmailAndUserId(email, userId) {
        return (this.db.clients.find((client) => client.userId === userId && client.email === email) ?? null);
    }
    async create(userId, input) {
        const record = {
            id: (0, id_factory_1.makeId)(),
            userId,
            name: input.name,
            phone: input.phone,
            email: input.email ?? null,
            createdAt: new Date(),
        };
        this.db.clients.push(record);
        return record;
    }
    async update(id, userId, input) {
        const index = this.db.clients.findIndex((client) => client.id === id && client.userId === userId);
        if (index < 0) {
            return null;
        }
        this.db.clients[index] = {
            ...this.db.clients[index],
            ...input,
            email: input.email === undefined ? this.db.clients[index].email : input.email,
        };
        return this.db.clients[index];
    }
    async delete(id, userId) {
        this.db.clients = this.db.clients.filter((client) => !(client.id === id && client.userId === userId));
    }
};
exports.ClientsInMemoryRepository = ClientsInMemoryRepository;
exports.ClientsInMemoryRepository = ClientsInMemoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [in_memory_database_service_1.InMemoryDatabaseService])
], ClientsInMemoryRepository);
//# sourceMappingURL=clients.in-memory.repository.js.map