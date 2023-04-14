FROM node
RUN yarn global add pnpm@7.18.1

WORKDIR /project

COPY . .
RUN pnpm install

WORKDIR /project/apps/api-server

CMD ["pnpm", "start"]
