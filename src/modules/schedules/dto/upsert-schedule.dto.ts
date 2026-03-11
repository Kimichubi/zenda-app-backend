import { IsInt, IsString, Max, Min } from "class-validator";

export class UpsertScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}
