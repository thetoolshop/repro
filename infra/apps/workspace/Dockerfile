# Development
FROM repro-base AS dev
EXPOSE 8080
CMD ["pnpm", "nx", "run", "@repro/workspace:dev-serve"]

# Production
FROM repro-base AS prod
EXPOSE 8080
CMD ["pnpm", "dotenvx", "run", "-f", "apps/workspace/.env.production", "--", "nx", "run", "@repro/workspace:serve"]
