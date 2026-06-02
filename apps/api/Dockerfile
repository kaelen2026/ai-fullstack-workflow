# syntax=docker/dockerfile:1
#
# Multi-stage build for the @repo/api Hono server.
# Build context MUST be the monorepo root:
#   docker build -f apps/api/Dockerfile -t repo-api .
# (the root docker-compose.yml already does this).

FROM node:22-alpine AS base
RUN corepack enable
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ---- Prune the workspace down to just what @repo/api needs ----
FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune @repo/api --docker

# ---- Install deps + build (output is fully bundled by tsup) ----
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@repo/api

# ---- Minimal runtime: just the bundled output + node ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 hono
COPY --from=builder /app/apps/api/dist ./dist
USER hono
EXPOSE 3001
CMD ["node", "dist/index.js"]
