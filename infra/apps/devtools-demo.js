const name = "devtools-demo";
const cwd = "apps/devtools-demo";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "nx run @repro/devtools-demo:dev-serve",
  },

  prod: {
    ...baseConfig,
    script: "serve",
    env: {
      PM2_SERVE_PATH: "dist/",
      PM2_SERVE_PORT: 8080,
      PM2_SERVE_SPA: true,
      PM2_SERVE_HOMEPAGE: "./index.html",
    },
  },
};
