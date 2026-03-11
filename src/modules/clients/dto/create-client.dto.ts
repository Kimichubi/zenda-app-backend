import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
