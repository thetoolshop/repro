module.exports = {
  apps: [
    require("../apps/api-server").prod,
    require("../apps/devtools-demo").prod,
  ],

  deploy: {
    production: {
      host: ["production"],
      ref: "origin/main",
      repo: "git@github.com:thetoolshop/repro.git",
      path: "/home/me/Projects/thetoolshop/repro",
      "post-deploy":
        "pnpm install && pnpm pm2 startOrRestart infra/appsets/production.config.js",
    },
  },
};
