FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && npm install -g pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN apk add --no-cache openssl
RUN pnpm install --frozen-lockfile

FROM base AS build
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runtime
RUN apk add --no-cache openssl curl
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p uploads && chown -R nestjs:nestjs /app

USER nestjs

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
