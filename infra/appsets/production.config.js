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
        "pnpm install && BUILD_ENV=production pnpm nx run-many -t build && pnpm pm2 startOrRestart infra/appsets/production.config.js",
    },
  },
};
