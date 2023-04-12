FROM node
RUN yarn global add pnpm@7.18.1

WORKDIR /project

COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml pnpm-workspace.yaml
RUN pnpm fetch

COPY . .

ENV NODE_ENV=development
RUN pnpm -r install --offline --ignore-scripts

ENV NODE_ENV=production
RUN pnpm -r run prepare 

WORKDIR /project/apps/api-server

CMD ["pnpm", "start"]
