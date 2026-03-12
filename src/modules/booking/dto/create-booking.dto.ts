import { IsDateString, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateBookingDto {
  @IsString()
  serviceId: string;

  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  clientName: string;

  @IsString()
  clientPhone: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;
}
