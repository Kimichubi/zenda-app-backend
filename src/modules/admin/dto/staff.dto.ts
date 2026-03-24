import { IsEmail, IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  commission: number;
}

export class UpdateCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}
