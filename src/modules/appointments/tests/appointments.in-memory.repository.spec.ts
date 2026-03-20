import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryDatabaseService } from '../../../infrastructure/database/in-memory-database.service';
import { AppointmentsInMemoryRepository } from '../appointments.in-memory.repository';

describe('AppointmentsInMemoryRepository', () => {
  let repository: AppointmentsInMemoryRepository;
  let db: InMemoryDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsInMemoryRepository,
        InMemoryDatabaseService,
      ],
    }).compile();

    repository = module.get<AppointmentsInMemoryRepository>(AppointmentsInMemoryRepository);
    db = module.get<InMemoryDatabaseService>(InMemoryDatabaseService);
    db.appointments = [];
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create an appointment', async () => {
    const apt = await repository.create('user1', { clientId: 'c1', date: new Date() });
    expect(apt).toHaveProperty('id');
    expect(apt.clientId).toBe('c1');
    expect(db.appointments.length).toBe(1);
  });

  it('should find many by user id', async () => {
    await repository.create('user1', { clientId: 'c1', date: new Date() });
    await repository.create('user2', { clientId: 'c2', date: new Date() });
    const list = await repository.findManyByUserId('user1');
    expect(list.length).toBe(1);
    expect(list[0].clientId).toBe('c1');
  });

  it('should find by week', async () => {
    const date1 = new Date('2023-01-05T10:00:00Z');
    const date2 = new Date('2023-01-15T10:00:00Z');
    await repository.create('user1', { clientId: 'c1', date: date1 });
    await repository.create('user1', { clientId: 'c2', date: date2 });
    
    const weekStart = new Date('2023-01-02T00:00:00Z');
    const list = await repository.findByWeek('user1', weekStart);
    expect(list.length).toBe(1);
    expect(list[0].clientId).toBe('c1');
    
    const listUser2 = await repository.findByWeek('user2', weekStart);
    expect(listUser2.length).toBe(0);
  });

  it('should find conflict', async () => {
    const date = new Date('2023-01-05T10:00:00Z');
    await repository.create('user1', { clientId: 'c1', date, startTime: '10:00' });
    const conflict = await repository.findConflict('user1', date, '10:00');
    expect(conflict).toBeDefined();
    
    const noConflict = await repository.findConflict('user1', date, '11:00');
    expect(noConflict).toBeNull();
    
    const noConflictDate = await repository.findConflict('user1', new Date(), '10:00');
    expect(noConflictDate).toBeNull();
  });

  it('should find by client id', async () => {
    await repository.create('user1', { clientId: 'c1', date: new Date() });
    const list = await repository.findByClientId('c1');
    expect(list.length).toBe(1);
    expect(list[0].clientId).toBe('c1');
  });

  it('should find by id', async () => {
    const apt = await repository.create('user1', { clientId: 'c1', date: new Date() });
    const found = await repository.findById(apt.id);
    expect(found?.id).toBe(apt.id);
    expect(await repository.findById('invalid')).toBeNull();
  });

  it('should find today by user id', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    await repository.create('user1', { clientId: 'c1', date: now });
    await repository.create('user1', { clientId: 'c2', date: yesterday });
    
    const list = await repository.findTodayByUserId('user1');
    expect(list.length).toBe(1);
    expect(list[0].clientId).toBe('c1');
  });

  it('should find upcoming by user id', async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const past = new Date(now);
    past.setDate(past.getDate() - 1);
    
    await repository.create('user1', { clientId: 'c1', date: tomorrow });
    await repository.create('user1', { clientId: 'c2', date: past });
    
    const list = await repository.findUpcomingByUserId('user1');
    expect(list.length).toBe(1);
    expect(list[0].clientId).toBe('c1');
  });

  it('should update status', async () => {
    const apt = await repository.create('user1', { clientId: 'c1', date: new Date() });
    const updated = await repository.updateStatus(apt.id, 'user1', 'CONFIRMED' as any);
    expect(updated?.status).toBe('CONFIRMED');
    
    const notFound = await repository.updateStatus('invalid', 'user1', 'CONFIRMED' as any);
    expect(notFound).toBeNull();
  });
});
