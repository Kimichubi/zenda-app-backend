import { Test, TestingModule } from '@nestjs/testing';
import { ServicesInMemoryRepository } from './services.in-memory.repository';
import { InMemoryDatabaseService } from '../../infrastructure/database/in-memory-database.service';

jest.mock('../../infrastructure/database/id.factory', () => ({
  makeId: jest.fn(() => 'mock-id'),
}));

describe('ServicesInMemoryRepository', () => {
  let repository: ServicesInMemoryRepository;
  let db: InMemoryDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesInMemoryRepository,
        InMemoryDatabaseService,
      ],
    }).compile();

    repository = module.get<ServicesInMemoryRepository>(ServicesInMemoryRepository);
    db = module.get<InMemoryDatabaseService>(InMemoryDatabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a service', async () => {
      const input = { name: 'Test', duration: 30, price: 100 };
      const result = await repository.create('user-1', input);
      
      expect(result).toEqual(expect.objectContaining({
        id: 'mock-id',
        userId: 'user-1',
        name: 'Test',
        duration: 30,
        price: 100,
        createdAt: expect.any(Date)
      }));
      expect(db.services.length).toBe(1);
    });
  });

  describe('findManyByUserId', () => {
    it('should return services for a specific user', async () => {
      db.services = [
        { id: '1', userId: 'user-1', name: 'A', duration: 10, price: 10, createdAt: new Date() },
        { id: '2', userId: 'user-2', name: 'B', duration: 10, price: 10, createdAt: new Date() },
      ];

      const result = await repository.findManyByUserId('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('findById', () => {
    it('should return a service by id', async () => {
      db.services = [
        { id: '1', userId: 'user-1', name: 'A', duration: 10, price: 10, createdAt: new Date() },
      ];

      const result = await repository.findById('1');
      expect(result?.id).toBe('1');
    });

    it('should return null if service not found', async () => {
      db.services = [];
      const result = await repository.findById('1');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the service', async () => {
      db.services = [
        { id: '1', userId: 'user-1', name: 'A', duration: 10, price: 10, createdAt: new Date() },
      ];

      const result = await repository.update('1', 'user-1', { name: 'B' });
      expect(result?.name).toBe('B');
      expect(db.services[0].name).toBe('B');
    });

    it('should return null if service not found for user', async () => {
      db.services = [
        { id: '1', userId: 'user-2', name: 'A', duration: 10, price: 10, createdAt: new Date() },
      ];

      const result = await repository.update('1', 'user-1', { name: 'B' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete the service', async () => {
      db.services = [
        { id: '1', userId: 'user-1', name: 'A', duration: 10, price: 10, createdAt: new Date() },
      ];

      await repository.delete('1', 'user-1');
      expect(db.services.length).toBe(0);
    });

    it('should not delete if user id does not match', async () => {
      db.services = [
        { id: '1', userId: 'user-2', name: 'A', duration: 10, price: 10, createdAt: new Date() },
      ];

      await repository.delete('1', 'user-1');
      expect(db.services.length).toBe(1);
    });
  });
});