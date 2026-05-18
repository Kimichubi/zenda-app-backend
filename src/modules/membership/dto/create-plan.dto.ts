import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class PlanServiceDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;
}

export class CreateMembershipPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @IsOptional()
  @IsString()
  billingFrequency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanServiceDto)
  servicesIncluded?: PlanServiceDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimitsPerPeriod?: number;

  @IsOptional()
  @IsBoolean()
  autoRenewal?: boolean;

  @IsOptional()
  @IsString()
  extraBenefits?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  validDays?: number;

  @IsOptional()
  @IsString()
  validStartHour?: string;

  @IsOptional()
  @IsString()
  validEndHour?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minCommitmentMonths?: number;

  @IsOptional()
  @IsString()
  cancellationRules?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxActiveSubscriptions?: number;
}
