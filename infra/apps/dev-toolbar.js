const name = "dev-toolbar";
const cwd = "apps/dev-toolbar";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "watch",
    env: {
      BUILD_ENV: "development",
      STATS_LEVEL: "debug",
    },
  },
};
