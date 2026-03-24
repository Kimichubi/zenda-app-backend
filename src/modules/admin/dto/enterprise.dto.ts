import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateLoyaltyConfigDto {
  @IsNumber()
  @Min(0)
  pointsPerReal: number;

  @IsNumber()
  @Min(0)
  minRedeemPoints: number;

  @IsBoolean()
  active: boolean;
}

export class RedeemPointsDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsNumber()
  @Min(1)
  points: number;
}

export class MarkCommissionsPaidDto {
  @IsArray()
  @IsString({ each: true })
  commissionIds: string[];
}
