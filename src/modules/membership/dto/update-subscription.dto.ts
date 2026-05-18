import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateClientSubscriptionDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @IsOptional()
  @IsString()
  cancelReason?: string;

  @IsOptional()
  @IsString()
  pauseUntil?: string;
}
