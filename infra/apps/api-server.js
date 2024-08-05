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
      CERT_KEY_FILE: "/etc/letsencrypt/live/repro.dev/privkey.pem",
      CERT_FILE: "/etc/letsencrypt/live/repro.dev/cert.pem",
    },
  },
};
