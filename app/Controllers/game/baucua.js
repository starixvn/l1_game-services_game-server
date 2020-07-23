const cuoc = require("./baucua/cuoc");
const regOpen = require("./baucua/regOpen");
const viewlogs = require("./baucua/viewlogs");
const tops = require("./baucua/tops");
const bauCuaConfigs = require("./baucua/configs");

module.exports = function (client, data) {
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
  if (void 0 !== data.tops) {
    tops(client, data.tops);
  }
  if (!!data.viewlogs) {
    viewlogs(client, data.viewlogs);
  }
};
