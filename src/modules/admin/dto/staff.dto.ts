import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

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

export class UpdateStaffProfileDto {
  @IsOptional()
  @IsString()
  avatarPath?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;
}
