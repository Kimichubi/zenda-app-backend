import { InMemoryDatabaseService } from "../../infrastructure/database/in-memory-database.service";
import { UpsertScheduleDto } from "./dto/upsert-schedule.dto";
export declare class SchedulesService {
    private readonly db;
    constructor(db: InMemoryDatabaseService);
    list(userId: string): import("../../infrastructure/database/in-memory-database.service").ScheduleRecord[];
    upsert(userId: string, dto: UpsertScheduleDto): import("../../infrastructure/database/in-memory-database.service").ScheduleRecord;
}
