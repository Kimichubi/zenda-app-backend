import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule } from '../clients.module';
import { ClientsService } from '../clients.service';

describe('ClientsModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientsModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(ClientsService)).toBeDefined();
  });

  it('should compile with production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Need to re-import or somehow trigger the module evaluation 
    // but Jest isolates imports if we use require.
    jest.isolateModules(() => {
      const { ClientsModule } = require('../clients.module');
      expect(ClientsModule).toBeDefined();
    });

    process.env.NODE_ENV = originalEnv;
  });
});