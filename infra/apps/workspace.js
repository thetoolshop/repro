const name = "workspace";
const cwd = "apps/workspace";

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
