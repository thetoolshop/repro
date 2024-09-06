const name = "admin";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/admin/.env.development -- nx run @repro/admin:dev-serve",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/admin/.env.production -- nx run @repro/admin:serve",
  },
};
