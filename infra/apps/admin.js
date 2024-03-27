const name = "admin";
const cwd = "apps/admin";

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
