export declare enum AppointmentStatusDto {
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
export declare class UpdateAppointmentDto {
    status?: AppointmentStatusDto;
}
