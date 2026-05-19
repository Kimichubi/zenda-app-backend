export const BILLING_EVENTS = {
  SUBSCRIPTION_CREATED: "billing.subscription.created",
  SUBSCRIPTION_ACTIVATED: "billing.subscription.activated",
  SUBSCRIPTION_CANCELLED: "billing.subscription.cancelled",
  SUBSCRIPTION_EXPIRED: "billing.subscription.expired",
  SUBSCRIPTION_RENEWED: "billing.subscription.renewed",
  SUBSCRIPTION_UPGRADED: "billing.subscription.upgraded",
  SUBSCRIPTION_DOWNGRADED: "billing.subscription.downgraded",
  SUBSCRIPTION_PAST_DUE: "billing.subscription.past_due",
  INVOICE_CREATED: "billing.invoice.created",
  INVOICE_PAID: "billing.invoice.paid",
  INVOICE_OVERDUE: "billing.invoice.overdue",
  INVOICE_FAILED: "billing.invoice.failed",
  PAYMENT_SUCCEEDED: "billing.payment.succeeded",
  PAYMENT_FAILED: "billing.payment.failed",
  TRIAL_STARTED: "billing.trial.started",
  TRIAL_EXPIRED: "billing.trial.expired",
  PLAN_CHANGED: "billing.plan.changed",
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  INITIAL_DELAY_MS: 60_000,
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 86_400_000,
  GRACE_PERIOD_DAYS: 5,
  OVERDUE_DAYS: 3,
  CANCELLATION_GRACE_DAYS: 30,
} as const;

export const DEFAULT_TRIAL_DAYS = 14;
export const DEFAULT_PLAN_PRICES = {
  FREE: 0,
  PRO: 49.90,
  ENTERPRISE: 149.90,
} as const;

export const ABACATE_API = {
  BASE_URL: "https://api.abacatepay.com/v1",
  TIMEOUT: 15_000,
  MAX_RETRIES: 3,
} as const;
