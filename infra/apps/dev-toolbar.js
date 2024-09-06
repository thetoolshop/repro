const name = "dev-toolbar";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/dev-toolbar/.env.development -- nx run @repro/dev-toolbar:watch",
  },
};
