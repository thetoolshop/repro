const name = "api-server";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/api-server/.env.development -- nx run @repro/api-server:dev-watch",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/api-server/.env.production -- nx run @repro/api-server:start",
  },
};
