# Build stage for both dev and prod
FROM node:20-slim as base
WORKDIR /app
RUN corepack enable

# Development stage
FROM base-dev-deps as dev
COPY . .
EXPOSE 3005
CMD ["pnpm", "dotenvx", "run", "-f", "apps/public-playback-ui/.env.development", "--", "nx", "run", "@repro/public-playback-ui:dev-serve"]

# Production build stage
FROM base-prod-deps as build
COPY . .
RUN pnpm dotenvx run -f apps/public-playback-ui/.env.production -- nx run @repro/public-playback-ui:build

# Production serve stage
FROM nginx:alpine as prod
COPY --from=build /app/apps/public-playback-ui/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 