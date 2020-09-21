const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const ConfigHelper = require("../../../Helpers/ConfigHelper");
const cuoc = require("./cuoc").miniDragonTigerCuoc;
const getLogs = require("./getLogs");
const viewLogs = require("./viewLogs");
const logger = require("./../../../web/logger");

module.exports = function (client, data) {
  if (void 0 !== data.view) {
    client.gameEvent.viewMiniDragonTiger = !!data.view;
  }

  if (!!data.get_time) {
    GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniDragonTiger }, function (err, data) {
      try {
        if (err) {
          logger.logError(err);
        }

        if (client.redT == null) {
          return;
        }

        const disabled = data == null || !data.enabled;
        const disabledMessage = data == null ? "" : data.disabled_message;
        client.red({
          mini: { dragon_tiger: { time_remain: client.redT.miniDragonTiger.time, um: disabled, um_message: disabledMessage } },
        });
      } catch (ex) {
        logger.logError(ex);
      }
    });
  }

  if (!!data.cuoc) {
    cuoc(client, data.cuoc);
  }

  if (!!data.getLogs) {
    getLogs(client);
  }

  if (!!data.viewlogs) {
    viewLogs(client, data.viewlogs);
  }
};
