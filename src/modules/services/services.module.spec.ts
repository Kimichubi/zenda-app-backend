import { Test } from '@nestjs/testing';
import { ServicesModule } from './services.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { InMemoryDatabaseService } from '../../infrastructure/database/in-memory-database.service';

describe('ServicesModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [ServicesModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(InMemoryDatabaseService)
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });
});
