import { IsDateString, IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

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

  @IsOptional()
  @IsUUID()
  professionalId?: string;
}
