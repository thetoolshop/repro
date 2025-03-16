const name = "public-api-server";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/api-server/.env-public.development -- nx run @repro/api-server:dev-watch:public",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenx run -f apps/api-server/.env-public.production -- nx run @repro/api-server:start:public",
  },
};
