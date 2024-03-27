const name = "api-server";
const cwd = "apps/api-server";

const baseConfig = {
  name,
  cwd,
};

module.exports = {
  dev: {
    ...baseConfig,
    script: "pnpm",
    args: "dev-watch",
    env: {
      NODE_ENV: "development",
      HOST: "localhost",
      PORT: "8181",
      DB_FILE: "tmp/repro-data.db",
      STORAGE_DIR: "tmp/storage",
      CERT_KEY_FILE: "../../certs/local.key",
      CERT_FILE: "../../certs/local.crt",
    },
  },

  prod: {
    ...baseConfig,
    script: "pnpm",
    args: "start",
    env: {
      NODE_ENV: "production",
      HOST: "localhost",
      PORT: "8181",
      DB_FILE: "tmp/repro-data.db",
      STORAGE_DIR: "tmp/storage",
      CERT_KEY_FILE: "../../certs/prod/api-server.key",
      CERT_FILE: "../../certs/prod/api-server.crt",
    },
  },
};
