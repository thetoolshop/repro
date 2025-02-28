module.exports = {
  apps: [
    require("../apps/mailpit").dev,
    require("../apps/admin-api-server").dev,
    require("../apps/api-server").dev,
    require("../apps/workspace").dev,
    require("../apps/admin").dev,
    require("../apps/capture").dev,
  ],
};
