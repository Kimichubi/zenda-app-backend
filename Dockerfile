FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

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
RUN apk add --no-cache openssl curl tini
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
RUN pnpm prisma generate

RUN mkdir -p uploads && chown -R nestjs:nestjs /app

USER nestjs

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512 --enable-source-maps"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node dist/main.js"]
