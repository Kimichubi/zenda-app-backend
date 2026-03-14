# Backend Development Guidelines

## Tech Stack
- Framework: NestJS (v11)
- Package Manager: pnpm
- Testing: Jest + Supertest
- Database: Prisma + PostgreSQL
- Queue/Redis: BullMQ + Redis
- Auth: Passport + JWT + bcrypt

## Rules
- **TDD Requirement:** Never write implementation code before a test. 
  1. Write the test.
  2. Run the test and show failure.
  3. Implement minimum code.
  4. Run test to validate.
- **Simplicity (KISS):** Do not add libraries or abstractions unless explicitly necessary to make the test pass or requested by the user.
- **Feedback:** Always ask the user if we should proceed or refactor after a small victory (test passing).

## Commands
- Run tests: `pnpm test`
- Run tests (watch): `pnpm test:watch`
- Run e2e tests: `pnpm test:e2e`
- Run dev server: `pnpm start:dev`
- DB migrations: `pnpm prisma:migrate dev`
