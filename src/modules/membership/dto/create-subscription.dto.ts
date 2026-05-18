import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateClientSubscriptionDto {
  @IsString()
  planId: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;
}
