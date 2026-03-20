import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ClientsService } from "../clients.service";
import { ClientsRepository } from "../clients.repository";
import { FindClientsDto } from "../dto/find-clients.dto";

describe("ClientsService", () => {
  let service: ClientsService;
  const clientsRepository = {
    findManyByUserId: jest.fn(),
    findByEmailAndUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: ClientsRepository,
          useValue: clientsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ClientsService);
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return clients for a user with pagination", async () => {
      const mockResult = {
        data: [{ id: "c1" }],
        total: 1,
      };
      clientsRepository.findManyByUserId.mockResolvedValue(mockResult);
      
      const dto: FindClientsDto = { page: 1, limit: 10 };
      const res = await service.findAll("u1", dto);
      
      expect(res).toEqual({
        data: [{ id: "c1" }],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(clientsRepository.findManyByUserId).toHaveBeenCalledWith("u1", dto);
    });
  });

  describe("create", () => {
    it("should create a client if email is not taken", async () => {
      clientsRepository.findByEmailAndUserId.mockResolvedValue(null);
      clientsRepository.create.mockResolvedValue({ id: "c1" });
      
      const res = await service.create("u1", { name: "John", email: "j@j.com", phone: "123" });
      expect(res).toEqual({ id: "c1" });
      expect(clientsRepository.create).toHaveBeenCalledWith("u1", { name: "John", email: "j@j.com", phone: "123" });
    });

    it("should create a client if no email provided", async () => {
      clientsRepository.create.mockResolvedValue({ id: "c1" });
      
      const res = await service.create("u1", { name: "John", phone: "123" });
      expect(res).toEqual({ id: "c1" });
      expect(clientsRepository.create).toHaveBeenCalledWith("u1", { name: "John", phone: "123" });
      expect(clientsRepository.findByEmailAndUserId).not.toHaveBeenCalled();
    });

    it("should throw conflict if email already exists", async () => {
      clientsRepository.findByEmailAndUserId.mockResolvedValue({ id: "c-existing" });
      
      await expect(service.create("u1", { name: "John", email: "j@j.com", phone: "123" }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("should update a client", async () => {
      clientsRepository.update.mockResolvedValue({ id: "c1", name: "John Updated" });
      const res = await service.update("u1", "c1", { name: "John Updated" });
      expect(res).toEqual({ id: "c1", name: "John Updated" });
    });
  });

  describe("remove", () => {
    it("should remove a client", async () => {
      clientsRepository.delete.mockResolvedValue(undefined);
      await service.remove("u1", "c1");
      expect(clientsRepository.delete).toHaveBeenCalledWith("c1", "u1");
    });
  });
});
