const name = "capture";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/capture/.env.development -- nx run @repro/capture:watch",
  },
};
