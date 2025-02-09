FROM node:22-slim as base
WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@8.3.1 --activate

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline
