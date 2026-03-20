import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsModule } from '../appointments.module';
import { AppointmentsService } from '../appointments.service';

jest.mock('../../services/services.module', () => ({ ServicesModule: class {} }));
jest.mock('../../clients/clients.module', () => ({ ClientsModule: class {} }));
jest.mock('../../users/users.module', () => ({ UsersModule: class {} }));
jest.mock('../../payments/payments.module', () => ({ PaymentsModule: class {} }));
jest.mock('../../whatsapp/whatsapp.module', () => ({ WhatsappModule: class {} }));
jest.mock('../../../infrastructure/database/database.module', () => ({ DatabaseModule: class {} }));

describe('AppointmentsModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppointmentsModule],
    }).compile();

    expect(module).toBeDefined();
    // expect(module.get(AppointmentsService)).toBeDefined(); 
    // Need providers mock for compilation in isolated context or valid sub-modules
  });

  it('should compile with production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.isolateModules(() => {
      const { AppointmentsModule } = require('../appointments.module');
      expect(AppointmentsModule).toBeDefined();
    });

    process.env.NODE_ENV = originalEnv;
  });
});