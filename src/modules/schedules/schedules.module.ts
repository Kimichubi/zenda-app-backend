import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../infrastructure/database/database.module";
import { SchedulesController } from "./schedules.controller";
import { SchedulesService } from "./schedules.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
