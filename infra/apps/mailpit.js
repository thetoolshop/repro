const name = "mailpit";
const cwd = ".";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "nx run @repro/api-server:start-mailpit",
  },
};
