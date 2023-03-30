FROM node
RUN yarn global add pnpm@7.18.1

WORKDIR /project

COPY pnpm-lock.yaml pnpm-lock.yaml
COPY pnpm-workspace.yaml pnpm-workspace.yaml
RUN pnpm fetch

COPY . .

RUN pnpm -r install --offline --ignore-scripts
RUN pnpm -r run prepare 

WORKDIR /project/apps/api-server

CMD ["pnpm", "start"]
