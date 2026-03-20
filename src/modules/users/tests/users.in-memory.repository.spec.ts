import { Test } from "@nestjs/testing";
import { UsersInMemoryRepository } from "../users.in-memory.repository";
import { InMemoryDatabaseService } from "../../../infrastructure/database/in-memory-database.service";

// Mock makeId
jest.mock("../../../infrastructure/database/id.factory", () => ({
  makeId: () => "mock-id",
}));

describe("UsersInMemoryRepository", () => {
  let repository: UsersInMemoryRepository;
  let db: InMemoryDatabaseService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UsersInMemoryRepository, InMemoryDatabaseService],
    }).compile();

    repository = moduleRef.get(UsersInMemoryRepository);
    db = moduleRef.get(InMemoryDatabaseService);
  });

  it("should create user", async () => {
    const input = {
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      phone: "123",
      businessName: "Biz",
      slug: "joao",
    };

    const result = await repository.create(input);

    expect(result.id).toBe("mock-id");
    expect(result.name).toBe("Joao");
    expect(result.role).toBe("USER");
    expect(result.plan).toBe("FREE");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(db.users.length).toBe(1);
    expect(db.users[0]).toEqual(result);
  });

  describe("finders", () => {
    beforeEach(() => {
      db.users.push({
        id: "u1",
        email: "test1@test.com",
        slug: "slug1",
        name: "Test 1",
        passwordHash: "hash",
        phone: "123",
        businessName: "Biz 1",
        role: "USER",
        plan: "FREE",
        createdAt: new Date(),
      } as any);
      db.users.push({
        id: "u2",
        email: "test2@test.com",
        slug: "slug2",
        name: "Test 2",
        passwordHash: "hash",
        phone: "456",
        businessName: "Biz 2",
        role: "USER",
        plan: "FREE",
        createdAt: new Date(),
      } as any);
    });

    it("should findByEmail", async () => {
      const user = await repository.findByEmail("test1@test.com");
      expect(user).toBeDefined();
      expect(user?.id).toBe("u1");

      const notFound = await repository.findByEmail("not@test.com");
      expect(notFound).toBeNull();
    });

    it("should findById", async () => {
      const user = await repository.findById("u2");
      expect(user).toBeDefined();
      expect(user?.id).toBe("u2");

      const notFound = await repository.findById("u3");
      expect(notFound).toBeNull();
    });

    it("should findBySlug", async () => {
      const user = await repository.findBySlug("slug1");
      expect(user).toBeDefined();
      expect(user?.id).toBe("u1");

      const notFound = await repository.findBySlug("slug3");
      expect(notFound).toBeNull();
    });

    it("should findAll", async () => {
      const users = await repository.findAll();
      expect(users.length).toBe(2);
    });

    it("should update user", async () => {
      const updated = await repository.update("u1", { name: "Updated Name" });
      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Updated Name");

      const checkDb = await repository.findById("u1");
      expect(checkDb?.name).toBe("Updated Name");

      const notFound = await repository.update("u3", { name: "Test" });
      expect(notFound).toBeNull();
    });
  });
});
