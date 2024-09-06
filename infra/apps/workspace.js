const name = "workspace";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/workspace/.env.development -- nx run @repro/workspace:dev-serve",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/workspace/.env.production -- nx run @repro/workspace:serve",
  },
};
