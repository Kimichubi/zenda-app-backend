import { validate } from 'class-validator';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';

describe('Client DTOs', () => {
  describe('CreateClientDto', () => {
    it('should validate correctly', async () => {
      const dto = new CreateClientDto();
      dto.name = 'Jo';
      dto.phone = '1234567890';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid data', async () => {
      const dto = new CreateClientDto();
      dto.name = 'J';
      dto.phone = '123';
      dto.email = 'not-an-email';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateClientDto', () => {
    it('should validate correctly', async () => {
      const dto = new UpdateClientDto();
      dto.name = 'Jo';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});