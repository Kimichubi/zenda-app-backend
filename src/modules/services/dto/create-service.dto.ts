import { IsNumber, IsString, Min, MinLength } from "class-validator";

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsNumber()
  @Min(5)
  duration: number;

  @IsNumber()
  @Min(0)
  price: number;
}
