# Build stage for both dev and prod
FROM node:20-slim as base
WORKDIR /app
RUN corepack enable

# Development stage
FROM base-dev-deps as dev
COPY . .
EXPOSE 3006
CMD ["pnpm", "dotenvx", "run", "-f", "apps/workspace/.env.development", "--", "nx", "run", "@repro/workspace:dev-serve"]

# Production build stage
FROM base-prod-deps as build
COPY . .
RUN pnpm dotenvx run -f apps/workspace/.env.production -- nx run @repro/workspace:build

# Production serve stage
FROM nginx:alpine as prod
COPY --from=build /app/apps/workspace/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 