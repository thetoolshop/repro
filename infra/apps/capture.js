const name = "capture";
const cwd = "apps/capture";

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
      MIXPANEL_API_URL: "0",
      MIXPANEL_TOKEN: "0",
      REPRO_APP_URL: "http://localhost:8080",
      REPRO_API_URL: "https://localhost:8181",
      AUTH_STORAGE: "memory",
      STATS_LEVEL: "debug",
    },
  },
};
