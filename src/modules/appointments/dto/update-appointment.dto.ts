import { IsEnum, IsOptional } from "class-validator";

export enum AppointmentStatusDto {
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatusDto)
  status?: AppointmentStatusDto;
}
