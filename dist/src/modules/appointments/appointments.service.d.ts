import { AppointmentsRepository } from "./appointments.repository";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
export declare class AppointmentsService {
    private readonly appointmentsRepository;
    constructor(appointmentsRepository: AppointmentsRepository);
    findAll(userId: string): Promise<import("./appointments.entity").AppointmentEntity[]>;
    create(userId: string, dto: CreateAppointmentDto): Promise<import("./appointments.entity").AppointmentEntity>;
    update(userId: string, id: string, dto: UpdateAppointmentDto): Promise<import("./appointments.entity").AppointmentEntity | null>;
}
