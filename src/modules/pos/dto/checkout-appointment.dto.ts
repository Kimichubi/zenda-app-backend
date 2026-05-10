import { IsString, IsOptional, IsNumber, IsBoolean, Min } from "class-validator";

export class CheckoutAppointmentDto {
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tipPercentage?: number;

  @IsOptional()
  @IsBoolean()
  useInternalCredit?: boolean;

  @IsOptional()
  @IsBoolean()
  splitEnabled?: boolean;
}
