const name = "capture-public";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/capture-public/.env.development -- nx run @repro/capture-public:watch",
  },
};
