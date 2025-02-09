# Build stage for both dev and prod
FROM node:20-slim as base
WORKDIR /app
RUN corepack enable

# Development stage
FROM base-dev-deps as dev
COPY . .
EXPOSE 3002
CMD ["pnpm", "dotenvx", "run", "-f", "apps/api-server/.env-public.development", "--", "nx", "run", "@repro/api-server:dev-public"]

# Production build stage
FROM base-prod-deps as build
COPY . .
RUN pnpm dotenvx run -f apps/api-server/.env-public.production -- nx run @repro/api-server:build-public

# Production serve stage
FROM node:20-slim as prod
WORKDIR /app
COPY --from=build /app/apps/api-server/dist ./dist
EXPOSE 3002
CMD ["node", "dist/public.js"] 