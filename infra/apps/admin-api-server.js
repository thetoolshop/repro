const name = "admin-api-server";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/api-server/.env-admin.development -- nx run @repro/api-server:dev-watch:admin",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenx run -f apps/api-server/.env-admin.production -- nx run @repro/api-server:start:admin",
  },
};
