import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    findAll(user: {
        sub: string;
    }): Promise<import("./appointments.entity").AppointmentEntity[]>;
    create(user: {
        sub: string;
    }, dto: CreateAppointmentDto): Promise<import("./appointments.entity").AppointmentEntity>;
    update(user: {
        sub: string;
    }, id: string, dto: UpdateAppointmentDto): Promise<import("./appointments.entity").AppointmentEntity | null>;
}
