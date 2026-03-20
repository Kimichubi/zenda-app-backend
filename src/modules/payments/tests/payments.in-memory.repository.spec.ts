import { Test, TestingModule } from '@nestjs/testing';
import { InMemoryDatabaseService } from '../../../infrastructure/database/in-memory-database.service';
import { PaymentsInMemoryRepository } from '../payments.in-memory.repository';

describe('PaymentsInMemoryRepository', () => {
  let repo: PaymentsInMemoryRepository;
  let db: InMemoryDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsInMemoryRepository, InMemoryDatabaseService],
    }).compile();

    repo = module.get<PaymentsInMemoryRepository>(PaymentsInMemoryRepository);
    db = module.get<InMemoryDatabaseService>(InMemoryDatabaseService);
    db.payments = [];
    db.appointments = [];
  });

  it('should create a payment', async () => {
    const p = await repo.create({ appointmentId: 'a1', amount: 100 });
    expect(p).toBeDefined();
    expect(p.appointmentId).toBe('a1');
    expect(p.amount).toBe(100);
    expect(db.payments.length).toBe(1);
    
    const paid = await repo.create({ appointmentId: 'a2', amount: 50, status: 'PAID' });
    expect(paid.paidAt).toBeDefined();
  });

  it('should create pix payment', async () => {
    const p = await repo.createPix({ appointmentId: 'a1', amount: 100, pixCode: 'pix123' });
    expect(p.pixCode).toBe('pix123');
    expect(p.status).toBe('PENDING');
  });

  it('should find many by user id', async () => {
    db.appointments.push({ id: 'a1', userId: 'u1' } as any);
    await repo.create({ appointmentId: 'a1', amount: 100 });
    await repo.create({ appointmentId: 'a2', amount: 100 });
    const list = await repo.findManyByUserId('u1');
    expect(list.length).toBe(1);
    expect(list[0].appointmentId).toBe('a1');
  });

  it('should find by id', async () => {
    const p = await repo.create({ appointmentId: 'a1', amount: 100 });
    const found = await repo.findById(p.id);
    expect(found?.id).toBe(p.id);
    expect(await repo.findById('invalid')).toBeNull();
  });

  it('should find by appointment id', async () => {
    const p = await repo.create({ appointmentId: 'a1', amount: 100 });
    const found = await repo.findByAppointmentId('a1');
    expect(found?.id).toBe(p.id);
    expect(await repo.findByAppointmentId('invalid')).toBeNull();
  });

  it('should mark as paid', async () => {
    const p = await repo.create({ appointmentId: 'a1', amount: 100 });
    const paid = await repo.markAsPaid(p.id);
    expect(paid?.status).toBe('PAID');
    expect(paid?.paidAt).toBeDefined();
    expect(await repo.markAsPaid('invalid')).toBeNull();
  });

  it('should cancel', async () => {
    const p = await repo.create({ appointmentId: 'a1', amount: 100 });
    const cancelled = await repo.cancel(p.id, 'reason');
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.reason).toBe('reason');
    expect(await repo.cancel('invalid')).toBeNull();
  });

  it('should update status', async () => {
    const p = await repo.create({ appointmentId: 'a1', amount: 100 });
    const updated = await repo.updateStatus(p.id, 'PAID', 'reason', 'pix');
    expect(updated?.status).toBe('PAID');
    expect(updated?.reason).toBe('reason');
    expect(updated?.pixCode).toBe('pix');
    expect(updated?.paidAt).toBeDefined();
    
    const updatedPending = await repo.updateStatus(p.id, 'PENDING');
    expect(updatedPending?.status).toBe('PENDING');

    expect(await repo.updateStatus('invalid', 'PAID')).toBeNull();
  });
});
