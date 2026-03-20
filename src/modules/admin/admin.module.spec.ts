import { Test } from '@nestjs/testing';
import { AdminModule } from './admin.module';
import { UsersModule } from '../users/users.module';

describe('AdminModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    })
      .overrideProvider('UsersRepository')
      .useValue({})
      .compile();

    expect(module).toBeDefined();
  });
});
