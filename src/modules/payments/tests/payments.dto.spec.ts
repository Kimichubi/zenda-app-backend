import { validate } from 'class-validator';
import { CreatePixPaymentDto } from '../dto/create-pix-payment.dto';

describe('Payment DTOs', () => {
  it('should validate CreatePixPaymentDto', async () => {
    const dto = new CreatePixPaymentDto();
    dto.appointmentId = 'a1';
    dto.amount = 100;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    
    const invalidDto = new CreatePixPaymentDto();
    invalidDto.appointmentId = 123 as any;
    invalidDto.amount = -10;
    const errors2 = await validate(invalidDto);
    expect(errors2.length).toBeGreaterThan(0);
  });
});
