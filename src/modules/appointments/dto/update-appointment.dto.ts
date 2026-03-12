import { IsEnum, IsOptional, IsString } from "class-validator";

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
  startTime?: string;
}
