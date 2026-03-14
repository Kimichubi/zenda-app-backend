FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl
RUN pnpm install --frozen-lockfile

FROM base AS build
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runtime
# Install OpenSSL for Prisma in runtime
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
# Run migrations before starting the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
