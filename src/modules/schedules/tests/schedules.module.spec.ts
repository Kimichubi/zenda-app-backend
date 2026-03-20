import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesModule } from '../schedules.module';

jest.mock('../../../infrastructure/database/database.module', () => ({ DatabaseModule: class {} }));

describe('SchedulesModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SchedulesModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should compile with production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.isolateModules(() => {
      const { SchedulesModule } = require('../schedules.module');
      expect(SchedulesModule).toBeDefined();
    });

    process.env.NODE_ENV = originalEnv;
  });
});
