import { validate } from 'class-validator';
import { UpsertScheduleDto } from '../dto/upsert-schedule.dto';

describe('Schedule DTOs', () => {
  it('should validate UpsertScheduleDto', async () => {
    const dto = new UpsertScheduleDto();
    dto.weekday = 1;
    dto.startTime = '09:00';
    dto.endTime = '18:00';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    
    const invalidDto = new UpsertScheduleDto();
    invalidDto.weekday = 8; // Invalid
    invalidDto.startTime = 123 as any; // Invalid type
    const errors2 = await validate(invalidDto);
    expect(errors2.length).toBeGreaterThan(0);
  });
});
