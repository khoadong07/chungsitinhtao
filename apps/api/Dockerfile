FROM node:22-alpine AS base
RUN npm install -g pnpm@9

# ── deps ──────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
# Generate Prisma client before tsc so types are available
RUN cd apps/api && pnpm exec prisma generate
RUN pnpm --filter api build

# ── runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN npm install -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared ./packages/shared
COPY apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api
RUN pnpm exec prisma generate

EXPOSE 4000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
