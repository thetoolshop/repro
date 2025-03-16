module.exports = {
  apps: [
    require("../apps/mailpit").dev,
    require("../apps/admin-api-server").dev,
    require("../apps/public-api-server").dev,
    require("../apps/admin").dev,
    require("../apps/public-playback-ui").dev,
    require("../apps/capture-public").dev,
  ],
};
