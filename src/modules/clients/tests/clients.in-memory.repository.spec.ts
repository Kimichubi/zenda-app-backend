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

  it('should find clients by user id', async () => {
    await repository.create('user1', { name: 'John', phone: '123' });
    await repository.create('user2', { name: 'Jane', phone: '456' });
    const clients = await repository.findManyByUserId('user1');
    expect(clients.length).toBe(1);
    expect(clients[0].name).toBe('John');
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
    const clients = await repository.findManyByUserId('user1');
    expect(clients.length).toBe(0);
  });
});
