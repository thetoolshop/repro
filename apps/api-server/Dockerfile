FROM node:18.12.1
RUN corepack enable && corepack prepare pnpm@7.18.1 --activate

WORKDIR /project

COPY . .
RUN pnpm install
RUN pnpm nx run @repro/api-server:build

WORKDIR /project/apps/api-server

CMD ["pnpm", "start"]
