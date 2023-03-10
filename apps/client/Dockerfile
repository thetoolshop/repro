FROM node AS builder
RUN yarn global add pnpm

WORKDIR /project

COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml pnpm-workspace.yaml
RUN pnpm fetch

COPY . .

RUN pnpm -r install --offline --ignore-scripts
RUN pnpm -r run prepare

WORKDIR /project/apps/client

RUN pnpm run build:main

FROM caddy:2.6.4-alpine
COPY ./apps/client/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /project/apps/client/dist/main /srv
