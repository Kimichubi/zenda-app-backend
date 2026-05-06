import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsString()
  notes?: string;
}
