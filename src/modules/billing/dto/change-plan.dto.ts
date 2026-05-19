import { IsUUID, IsOptional, IsString } from "class-validator";

export class ChangePlanDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsString()
  billingType?: "MONTHLY" | "YEARLY";
}
