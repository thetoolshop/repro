const name = "devtools-demo";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/devtools-demo/.env.development -- nx run @repro/devtools-demo:dev-serve",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/devtools-demo/.env.production -- nx run @repro/devtools-demo:serve",
  },
};
