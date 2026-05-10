import { IsString, IsIn } from "class-validator";

export class UpdateStatusDto {
  @IsString()
  @IsIn(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
  status: string;
}
