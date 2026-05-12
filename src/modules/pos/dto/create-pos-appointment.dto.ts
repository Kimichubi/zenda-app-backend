import { IsString, IsOptional, IsNumber, IsDateString, Min } from "class-validator";

export class CreatePosAppointmentDto {
  @IsString()
  professionalId: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
