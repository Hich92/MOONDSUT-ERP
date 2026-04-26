# ══════════════════════════════════════════════════════════
#  Next.js — Dockerfile multi-stage
#  deps → builder → runner
# ══════════════════════════════════════════════════════════

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── STAGE 1 : dépendances ──────────────────────────────
FROM base AS deps
COPY package.json ./
RUN npm install

# ── STAGE 2 : build ───────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables au build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── STAGE 3 : runner (image finale minimale) ──────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# su-exec: lightweight su/gosu to switch user after volume permission fix
RUN apk add --no-cache su-exec

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Entrypoint fixes volume ownership then su-exec to nextjs
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p /app/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/entrypoint.sh"]
