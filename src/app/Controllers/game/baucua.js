const cuoc = require("./baucua/cuoc");
const regOpen = require("./baucua/regOpen");
const viewlogs = require("./baucua/viewlogs");
const bauCuaConfigs = require("./baucua/configs");
const ConfigHelper = require("../../Helpers/ConfigHelper");
const { checkGamePermission } = require("../game-permissin-check");

module.exports = function (client, data) {
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.BauCua);

  if (!checkGamePermission(client, configs, "Bầu Cua")) {
    return;
  }

  if (void 0 !== data.view) {
    client.gameEvent.viewBauCua = !!data.view;
  }

  if (!!data.get_odd) {
    client.red({
      mini: { baucua: { odds: bauCuaConfigs.odds } },
    });
  }

  if (!!data.regOpen) {
    regOpen(client);
  }

  if (!!data.cuoc) {
    cuoc.bauCuaCuoc(client, data.cuoc);
  }

  if (!!data.viewlogs) {
    viewlogs(client, data.viewlogs);
  }
};
