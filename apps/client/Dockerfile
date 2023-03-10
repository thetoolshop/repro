FROM node AS builder

ARG BUILD_ENV
ARG PADDLE_VENDOR_ID
ARG MIXPANEL_API_URL
ARG MIXPANEL_TOKEN
ARG REPRO_APP_URL
ARG REPRO_API_URL
ARG AUTH_STORAGE
ARG STATS_LEVEL

ENV BUILD_ENV=${BUILD_ENV} \
  PADDLE_VENDOR_ID=${PADDLE_VENDOR_ID} \
  MIXPANEL_API_URL=${MIXPANEL_API_URL} \
  MIXPANEL_TOKEN=${MIXPANEL_TOKEN} \
  REPRO_APP_URL=${REPRO_APP_URL} \
  REPRO_API_URL=${REPRO_API_URL} \
  AUTH_STORAGE=${AUTH_STORAGE} \
  STATS_LEVEL=${STATS_LEVEL}

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
