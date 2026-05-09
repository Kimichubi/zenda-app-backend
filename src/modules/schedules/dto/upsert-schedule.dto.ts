import { IsInt, IsString, IsOptional, IsBoolean, Max, Min } from "class-validator";

export class UpsertScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  slotDuration?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  breakStart?: string;

  @IsOptional()
  @IsString()
  breakEnd?: string;
}

export class BlockSlotDto {
  @IsString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsString()
  reason?: "MANUAL_BLOCK" | "BREAK" | "HOLIDAY" | "OTHER";
}

export class GetAvailabilityDto {
  @IsString()
  professionalId: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  serviceId?: string;
}