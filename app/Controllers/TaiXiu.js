var TaiXiu = require("./taixiu/index.js");
var getLogChat = require("./taixiu/getLogChat");
const logger = require('./../web/logger');
const GameConfigs = require('../Models/GameConfig/GameConfigs');

module.exports = function (client, data) {
  try {
    if (void 0 !== data.view) {
      client.gameEvent.viewTaiXiu = !!data.view;
    }

    if (!!data.get_time) {
      GameConfigs.findOne({ name: "taixiu" }, function (err, data) {
        if (err) {
          console.log("error to get config for taixiu");
        }

        var disabled = (data == null || !data.enabled);
        client.red({ taixiu: { time_remain: client.redT.TaiXiu_time, um: disabled } });
      });
    }

    if (!!data.getLogs) {
      TaiXiu.getLogs(client);
    }
    if (!!data.cuoc) {
      TaiXiu.cuoc(client, data.cuoc);
    }
    if (!!data.chat) {
      TaiXiu.chat(client, data.chat);
    }
    if (!!data.get_phien) {
      TaiXiu.get_phien(client, data.get_phien);
    }
    if (!!data.get_log) {
      TaiXiu.get_log(client, data.get_log);
    }
    if (!!data.get_top) {
      TaiXiu.get_top(client, data.get_top);
    }
    if (!!data.get_new) {
      TaiXiu.getNew(client);
    }
    if (!!data.getLogChat) {
      getLogChat(client);
    }
  } catch (error) {
    logger.logError(error);
  }
};
