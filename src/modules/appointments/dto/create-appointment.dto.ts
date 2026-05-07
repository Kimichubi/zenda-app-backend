import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  professionalId?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
