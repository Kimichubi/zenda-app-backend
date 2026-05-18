import { IsOptional, IsString } from "class-validator";

export class RecordUsageDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
