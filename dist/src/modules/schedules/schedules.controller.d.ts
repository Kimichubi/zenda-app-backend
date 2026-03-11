import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
import { SchedulesService } from "./schedules.service";
export declare class SchedulesController {
    private readonly schedulesService;
    constructor(schedulesService: SchedulesService);
    list(user: {
        sub: string;
    }): import("../../infrastructure/database/in-memory-database.service").ScheduleRecord[];
    upsert(user: {
        sub: string;
    }, dto: UpsertScheduleDto): import("../../infrastructure/database/in-memory-database.service").ScheduleRecord;
}
