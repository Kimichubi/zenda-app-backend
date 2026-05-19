import { IsString, IsOptional, IsUUID } from "class-validator";

export class CreateCheckoutDto {
  @IsUUID()
  @IsOptional()
  planId?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  billingType?: "MONTHLY" | "YEARLY";
}
