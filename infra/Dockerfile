FROM node:22-slim
WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@8.3.1 --activate

COPY ./patches/ ./patches/

# Install PNPM packages only if dependency versions have changed
COPY pnpm-lock.yaml ./
RUN pnpm fetch

# Add source files and install dependencies from store
COPY . .
RUN pnpm install --offline

# Run build step for all library packages with a build target
RUN pnpm nx run-many --target=build --projects=tag:type:package

EXPOSE 8080
