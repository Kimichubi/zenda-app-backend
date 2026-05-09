export interface ScheduleEntity {
  id: string;
  businessId: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface BlockedSlotEntity {
  id: string;
  businessId: string;
  professionalId: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: "MANUAL_BLOCK" | "BREAK" | "HOLIDAY" | "OTHER";
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityResult {
  date: string;
  professionalId: string;
  slots: TimeSlot[];
}