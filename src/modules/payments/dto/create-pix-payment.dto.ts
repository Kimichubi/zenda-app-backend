import { IsNumber, IsString, Min } from "class-validator";

export class CreatePixPaymentDto {
  @IsString()
  appointmentId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}
