import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreatePixPaymentDto {
  @IsString()
  appointmentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
