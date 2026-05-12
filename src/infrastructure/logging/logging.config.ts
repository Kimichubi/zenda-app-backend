export const LOGGING_CONFIG = {
  MAX_PAYLOAD_SIZE: 10 * 1024,
  SKIP_ROUTES: ["/health", "/metrics"],
  SKIP_METHODS: [] as string[],

  SENSITIVE_KEYS: new Set([
    "password",
    "passwordHash",
    "newPassword",
    "oldPassword",
    "confirmPassword",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "secret",
    "apiKey",
    "apikey",
    "passcode",
    "pin",
    "creditCard",
    "cvv",
    "ssn",
  ]),

  SENSITIVE_HEADERS: new Set([
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "x-refresh-token",
  ]),

  MASK_VALUE: "***REDACTED***",
} as const;
