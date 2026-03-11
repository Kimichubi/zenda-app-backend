import { IsDateString, IsString } from "class-validator";

export class CreateAppointmentDto {
  @IsString()
  clientId: string;

  @IsDateString()
  date: string;
}
