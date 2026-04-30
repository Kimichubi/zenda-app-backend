# Backend Development Guidelines

## Tech Stack
- **Framework**: NestJS 11, TypeScript
- **Testing**: Jest + Supertest (unit + integration)
- **Database**: PostgreSQL + Prisma ORM v7
- **Queue**: BullMQ + Redis
- **Auth**: JWT (Access Token 15min + Refresh Token 7d)
- **Validation**: class-validator + class-transformer (DTOs)
- **Scheduler**: @nestjs/schedule (cron jobs for WhatsApp notifications)

## Architecture
```
src/
├── main.ts                          # Bootstrap, CORS, pipes, guards
├── app.module.ts                    # Root module
├── common/                          # Cross-cutting concerns
│   ├── decorators/                  # Custom decorators (@CurrentUser, etc.)
│   ├── filters/                     # Exception filters
│   ├── guards/                      # JWT auth guard, Admin guard
│   ├── interceptors/                # Logging interceptor
│   ├── interfaces/                  # Shared interfaces
│   └── utils/                       # Utility functions (pix-generator)
├── infrastructure/                  # Infrastructure layer
│   ├── config/                      # Env validation
│   ├── database/                    # Prisma service, ID factory
│   ├── notifications/               # WhatsApp service, cron, webhooks
│   ├── queues/                      # BullMQ queues
│   └── redis/                       # Redis provider
├── modules/                         # Feature modules
│   ├── auth/                        # Login, signup, refresh
│   ├── clients/                     # Client CRUD
│   ├── appointments/                # Appointment CRUD + status
│   ├── services/                    # Service catalog CRUD
│   ├── payments/                    # Payment processing, Pix
│   ├── admin/                       # Enterprise features (POS, staff, commissions, etc.)
│   └── ...                          # One folder per domain

prisma/
└── schema.prisma                    # Database schema
```

## Rules

### TDD (Mandatory)
- Never write implementation code before a test.
- 1. Write spec file → 2. Run & confirm failure → 3. Implement → 4. Confirm green.
- Unit tests for services, repositories, controllers.
- Integration tests for critical flows (auth, payments, appointments).

### Simplicity (KISS)
- Do not add unnecessary modules, guards, or interceptors.
- NestJS providers are enough — no custom wrappers unless needed for testing.
- Use the Prisma repository pattern, not direct Prisma calls in services.

### Code Standards
- **DTOs**: Use `class-validator` decorators, not Zod in DTOs.
- **No `any` types**: Define interfaces explicitly.
- **Path aliases**: Use `@/` or module-relative imports consistently.
- **Error handling**: Throw HttpExceptions with proper status codes. Let the global filter format responses.

### Testing Patterns
- Use Jest with `describe/it/expect` structure.
- Mock PrismaService with in-memory repositories for unit tests.
- Use `Test.createTestingModule` from `@nestjs/testing`.
- Tests use `*.spec.ts` suffix (Jest convention, not Vitest).

### API Conventions
- All routes prefixed with module name (NestJS convention).
- Use `Request` with user context from JwtAuthGuard.
- Pagination: `page` and `limit` query params, return `{ data, total, page, limit }`.
- Dates in ISO-8601 UTC.

### Prisma Notes
- Use Prisma Service as a provider, not direct client instantiation.
- Migrations: `pnpm prisma:migrate`
- Generate client: `pnpm prisma:generate`
- Repository pattern with in-memory fallback for testability.

## Commands
- Run tests: `pnpm test`
- Run tests (watch): `pnpm test:watch`
- Run coverage: `pnpm test:cov`
- Run dev server: `pnpm start:dev`
- Build: `pnpm build`
- Start infra (docker): `pnpm start:infra`
- Prisma Studio: `pnpm prisma:studio`
- Lint: `pnpm lint`
