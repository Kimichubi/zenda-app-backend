import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryDatabaseService } from '../../../infrastructure/database/in-memory-database.service';
import { SchedulesInMemoryRepository } from '../schedules.in-memory.repository';

describe('SchedulesInMemoryRepository', () => {
  let repo: SchedulesInMemoryRepository;
  let db: InMemoryDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchedulesInMemoryRepository, InMemoryDatabaseService],
    }).compile();

    repo = module.get<SchedulesInMemoryRepository>(SchedulesInMemoryRepository);
    db = module.get<InMemoryDatabaseService>(InMemoryDatabaseService);
    db.schedules = [];
  });

  it('should list by user id', async () => {
    await repo.upsert('u1', { weekday: 1, startTime: '09:00', endTime: '10:00' });
    await repo.upsert('u2', { weekday: 1, startTime: '09:00', endTime: '10:00' });
    const res = await repo.list('u1');
    expect(res.length).toBe(1);
  });

  it('should upsert schedule', async () => {
    const s1 = await repo.upsert('u1', { weekday: 1, startTime: '09:00', endTime: '10:00' });
    expect(s1.startTime).toBe('09:00');
    expect(db.schedules.length).toBe(1);

    const s2 = await repo.upsert('u1', { weekday: 1, startTime: '10:00', endTime: '11:00' });
    expect(s2.startTime).toBe('10:00');
    expect(db.schedules.length).toBe(1);
  });
});
