import { validate } from 'class-validator';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto, AppointmentStatusDto } from '../dto/update-appointment.dto';

describe('Appointment DTOs', () => {
  describe('CreateAppointmentDto', () => {
    it('should validate correctly', async () => {
      const dto = new CreateAppointmentDto();
      dto.clientId = 'c1';
      dto.date = '2023-01-01T10:00:00Z';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with invalid data', async () => {
      const dto = new CreateAppointmentDto();
      dto.clientId = 123 as any; // Invalid type
      dto.date = 'not-a-date';
      dto.price = -10; // Min(0)
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateAppointmentDto', () => {
    it('should validate correctly', async () => {
      const dto = new UpdateAppointmentDto();
      dto.status = AppointmentStatusDto.CONFIRMED;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});