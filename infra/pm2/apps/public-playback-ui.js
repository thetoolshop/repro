const name = "public-playback-ui";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/public-playback-ui/.env.development -- nx run @repro/public-playback-ui:dev-serve",
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "dotenvx run -f apps/public-playback-ui/.env.production -- nx run @repro/public-playback-ui:serve",
  },
};
