##### DEPENDENCIES
FROM node:23-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install Prisma Client
COPY prisma ./

# Install dependencies based on the preferred package manager

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./

RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
    else echo "Lockfile not found." && exit 1; \
    fi

##### BUILDER

FROM node:23-alpine AS builder
ARG DATABASE_URL
ARG NEXT_PUBLIC_CLIENTVAR
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ENV SKIP_ENV_VALIDATION=1
RUN npm run build


##### RUNNER
FROM node:23-alpine AS runner
RUN apk add --no-cache sqlite openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1


RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir /app/db
RUN chown nextjs:nodejs /app/db

COPY docker-entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

ENV PORT=3000

USER nextjs
ENV PORT=3000
EXPOSE 3000
EXPOSE 5555


ENTRYPOINT ["/code/entrypoint.sh"]
