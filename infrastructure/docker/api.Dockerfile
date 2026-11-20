FROM node:22-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
ENV PNPM_HOME=/pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dayshift/db generate
RUN pnpm build:packages
RUN pnpm --filter @dayshift/api build

FROM node:22-bookworm-slim AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy --schema /app/packages/db/prisma/schema.prisma && node dist/main.js"]
