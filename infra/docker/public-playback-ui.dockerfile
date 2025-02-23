# Development
FROM repro-base AS dev
EXPOSE 8080
CMD ["pnpm", "dotenvx", "run", "-f", "apps/public-playback-ui/.env.development", "--", "nx", "run", "@repro/public-playback-ui:dev-serve"]

# Production
FROM repro-base AS prod
EXPOSE 8080
CMD ["pnpm", "dotenvx", "run", "-f", "apps/public-playback-ui/.env.production", "--", "nx", "run", "@repro/public-playback-ui:serve"]
