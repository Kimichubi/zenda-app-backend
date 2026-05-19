export interface PlanLimits {
  maxStaff: number;
  maxClients: number;
  maxServices: number;
  maxAppointmentsPerMonth: number;
  hasReports: boolean;
  hasTeam: boolean;
  hasWhatsApp: boolean;
  hasApi: boolean;
  hasCustomDomain: boolean;
  storageMb: number;
}

export interface BillingMetadata {
  invoiceNumber?: string;
  description?: string;
  discount?: number;
  tax?: number;
  [key: string]: unknown;
}

export interface AbacateCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
}

export interface AbacateCheckoutResponse {
  id: string;
  url: string;
  expiresAt: string;
  status: string;
}

export interface AbacatePaymentResponse {
  id: string;
  status: "pending" | "paid" | "failed" | "refunded";
  pixCode?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  invoiceUrl?: string;
  paidAt?: string;
  fee?: number;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionPeriod {
  start: Date;
  end: Date;
}
