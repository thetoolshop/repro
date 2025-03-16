# Development
FROM repro-base AS dev
EXPOSE 8080
CMD ["pnpm", "dotenvx", "run", "-f", "apps/api-server/.env.development", "--", "nx", "run", "@repro/api-server:dev-watch"]

# Production
FROM repro-base AS prod
EXPOSE 8080
CMD ["pnpm", "dotenvx", "run", "-f", "apps/api-server/.env.production", "--", "nx", "run", "@repro/api-server:start"]
