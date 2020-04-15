var ChanLe = require("./index.js");
const logger = require('./../../../web/logger');
const GameConfigs = require('../../../Models/GameConfig/GameConfigs');

module.exports = function (client, data) {
  try {
    if (void 0 !== data.view) {
      client.gameEvent.viewTaiXiu = !!data.view;
    }

    if (!!data.get_time) {
      GameConfigs.findOne({ name: "taixiu" }, function (err, data) {
        if (err) {
          logger.logError(err);
        }

        var disabled = (data == null || !data.enabled);
        client.red({ taixiu: { time_remain: client.redT.ChanLe_time, um: disabled } });
      });
    }

    if (!!data.getLogs) {
      ChanLe.getLogs(client);
    }
    if (!!data.cuoc) {
      ChanLe.cuoc(client, data.cuoc);
    }

    if (!!data.get_phien) {
      ChanLe.get_phien(client, data.get_phien);
    }
    if (!!data.get_log) {
      ChanLe.get_log(client, data.get_log);
    }
    if (!!data.get_top) {
      ChanLe.get_top(client, data.get_top);
    }
    if (!!data.get_new) {
      ChanLe.getNew(client);
    }

  } catch (error) {
    logger.logError(error);
  }
};
