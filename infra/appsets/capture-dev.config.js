module.exports = {
  apps: [
    require("../apps/api-server").dev,
    require("../apps/workspace").dev,
    require("../apps/admin").dev,
    require("../apps/capture").dev,
  ],
};
