import { IsString, IsOptional, IsEmail, MinLength } from "class-validator";

export class CreateWalkInClientDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
