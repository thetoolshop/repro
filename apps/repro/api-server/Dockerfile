FROM node:18.12.1
RUN corepack enable && corepack prepare pnpm@8.3.1 --activate

WORKDIR /project

COPY . .
RUN pnpm install
RUN pnpm nx run @repro/api-server:build

WORKDIR /project/apps/repro/api-server

CMD ["pnpm", "start"]
