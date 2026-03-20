import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryDatabaseService } from '../../../infrastructure/database/in-memory-database.service';
import { ClientsInMemoryRepository } from '../clients.in-memory.repository';

describe('ClientsInMemoryRepository', () => {
  let repository: ClientsInMemoryRepository;
  let db: InMemoryDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsInMemoryRepository,
        InMemoryDatabaseService,
      ],
    }).compile();

    repository = module.get<ClientsInMemoryRepository>(ClientsInMemoryRepository);
    db = module.get<InMemoryDatabaseService>(InMemoryDatabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create a client', async () => {
    const client = await repository.create('user1', { name: 'John Doe', phone: '1234567890' });
    expect(client).toHaveProperty('id');
    expect(client.name).toBe('John Doe');
    expect(db.clients.length).toBe(1);
  });

  it('should find clients by user id with pagination', async () => {
    await repository.create('user1', { name: 'Client 1', phone: '111' });
    await repository.create('user1', { name: 'Client 2', phone: '222' });
    await repository.create('user1', { name: 'Client 3', phone: '333' });
    await repository.create('user2', { name: 'Jane', phone: '456' });
    
    const result = await repository.findManyByUserId('user1', { page: 1, limit: 2 });
    expect(result.data.length).toBe(2);
    expect(result.total).toBe(3);
    expect(result.data[0].name).toBe('Client 1');
    expect(result.data[1].name).toBe('Client 2');

    const resultPage2 = await repository.findManyByUserId('user1', { page: 2, limit: 2 });
    expect(resultPage2.data.length).toBe(1);
    expect(resultPage2.total).toBe(3);
    expect(resultPage2.data[0].name).toBe('Client 3');
  });

  it('should filter clients by search term (name, email, phone)', async () => {
    await repository.create('user1', { name: 'John Doe', phone: '123', email: 'john@test.com' });
    await repository.create('user1', { name: 'Jane Smith', phone: '456', email: 'jane@test.com' });
    await repository.create('user1', { name: 'Bob Johnson', phone: '789', email: 'bob@test.com' });

    // Search by name
    const searchName = await repository.findManyByUserId('user1', { search: 'John' });
    expect(searchName.data.length).toBe(2); // John Doe and Bob Johnson (contains 'ohn')
    
    // Search by phone
    const searchPhone = await repository.findManyByUserId('user1', { search: '456' });
    expect(searchPhone.data.length).toBe(1);
    expect(searchPhone.data[0].name).toBe('Jane Smith');

    // Search by email
    const searchEmail = await repository.findManyByUserId('user1', { search: 'bob@test.com' });
    expect(searchEmail.data.length).toBe(1);
    expect(searchEmail.data[0].name).toBe('Bob Johnson');
  });

  it('should filter by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // This is a bit tricky with in-memory if we can't control createdAt
    // But we can mock it or just rely on the fact that all created now will be after yesterday
    await repository.create('user1', { name: 'Client 1', phone: '111' });
    
    const result = await repository.findManyByUserId('user1', { 
      startDate: yesterday.toISOString(),
      endDate: tomorrow.toISOString()
    });
    expect(result.data.length).toBe(1);

    const resultEmpty = await repository.findManyByUserId('user1', { 
      startDate: tomorrow.toISOString()
    });
    expect(resultEmpty.data.length).toBe(0);
  });

  it('should find by email and user id', async () => {
    await repository.create('user1', { name: 'John', phone: '123', email: 'john@test.com' });
    const client = await repository.findByEmailAndUserId('john@test.com', 'user1');
    expect(client).toBeDefined();
    expect(client?.email).toBe('john@test.com');
    const notFound = await repository.findByEmailAndUserId('jane@test.com', 'user1');
    expect(notFound).toBeNull();
  });

  it('should find by phone and user id', async () => {
    await repository.create('user1', { name: 'John', phone: '123' });
    const client = await repository.findByPhoneAndUserId('123', 'user1');
    expect(client).toBeDefined();
    expect(client?.phone).toBe('123');
    const notFound = await repository.findByPhoneAndUserId('456', 'user1');
    expect(notFound).toBeNull();
  });

  it('should find by id', async () => {
    const created = await repository.create('user1', { name: 'John', phone: '123' });
    const client = await repository.findById(created.id);
    expect(client).toBeDefined();
    expect(client?.id).toBe(created.id);
    const notFound = await repository.findById('invalid');
    expect(notFound).toBeNull();
  });

  it('should update a client', async () => {
    const created = await repository.create('user1', { name: 'John', phone: '123' });
    const updated = await repository.update(created.id, 'user1', { name: 'John Updated' });
    expect(updated?.name).toBe('John Updated');
    expect(updated?.email).toBeNull();
    
    const updatedWithEmail = await repository.update(created.id, 'user1', { email: 'john@new.com' });
    expect(updatedWithEmail?.email).toBe('john@new.com');

    const notFound = await repository.update('invalid', 'user1', { name: 'New' });
    expect(notFound).toBeNull();
  });

  it('should delete a client', async () => {
    const created = await repository.create('user1', { name: 'John', phone: '123' });
    await repository.delete(created.id, 'user1');
    const result = await repository.findManyByUserId('user1', {});
    expect(result.data.length).toBe(0);
    expect(result.total).toBe(0);
  });
});
