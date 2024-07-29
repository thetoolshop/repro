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
    args: "dev-serve",
  },
};
