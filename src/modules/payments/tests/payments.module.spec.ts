import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsModule } from '../payments.module';

jest.mock('../../appointments/appointments.module', () => ({ AppointmentsModule: class {} }));
jest.mock('../../../infrastructure/database/database.module', () => ({ DatabaseModule: class {} }));

describe('PaymentsModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PaymentsModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should compile with production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.isolateModules(() => {
      const { PaymentsModule } = require('../payments.module');
      expect(PaymentsModule).toBeDefined();
    });

    process.env.NODE_ENV = originalEnv;
  });
});
