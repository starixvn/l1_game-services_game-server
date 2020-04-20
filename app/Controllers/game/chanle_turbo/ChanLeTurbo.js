var ChanLeTurbo = require("./index.js");
const logger = require('../../../web/logger');
const GameConfigs = require('../../../Models/GameConfig/GameConfigs');
const ConfigHelper = require('../../../Helpers/ConfigHelper');

module.exports = function (client, data) {
  try {
    if (void 0 !== data.view) {
      client.gameEvent.viewChanLeTurbo = !!data.view;
    }

    if (!!data.get_time) {
      GameConfigs.findOne({ name: ConfigHelper.GameTypes.CLTurbo }, function (err, data) {
        try {
          if (err) {
            logger.logError(err);
          }

          var disabled = (data == null || !data.enabled);
          client.red({ clturbo: { time_remain: client.redT.ChanLeTurbo_time, um: disabled } });

        } catch (ex) {
          logger.logError(ex);
        }
      });
    }

    if (!!data.getLogs) {
      ChanLeTurbo.getLogs(client);
    }
    if (!!data.cuoc) {
      ChanLeTurbo.cuoc(client, data.cuoc);
    }

    if (!!data.get_phien) {
      ChanLeTurbo.get_phien(client, data.get_phien);
    }
    if (!!data.get_log) {
      ChanLeTurbo.get_log(client, data.get_log);
    }
    if (!!data.get_top) {
      ChanLeTurbo.get_top(client, data.get_top);
    }
    if (!!data.get_new) {
      ChanLeTurbo.getNew(client);
    }

  } catch (error) {
    logger.logError(error);
  }
};
