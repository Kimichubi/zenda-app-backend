import { IsEnum, IsOptional, IsString, IsNumber, IsDateString } from "class-validator";

export enum AppointmentStatusDto {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatusDto)
  status?: AppointmentStatusDto;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}
