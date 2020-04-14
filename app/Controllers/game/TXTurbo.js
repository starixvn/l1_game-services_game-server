var TXTurbo = require("./TXTurbo/index");
const logger = require('./../../web/logger');
const GameConfigs = require('../../Models/GameConfig/GameConfigs');

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
                client.red({ taixiu: { time_remain: client.redT.TXTurbo_time, um: disabled } });
            });
        }

        if (!!data.getLogs) {
            TXTurbo.getLogs(client);
        }
        if (!!data.cuoc) {
            TXTurbo.cuoc(client, data.cuoc);
        }
        if (!!data.get_phien) {
            TXTurbo.get_phien(client, data.get_phien);
        }
        if (!!data.get_log) {
            TXTurbo.get_log(client, data.get_log);
        }
        if (!!data.get_top) {
            TXTurbo.get_top(client, data.get_top);
        }
        if (!!data.get_new) {
            TXTurbo.getNew(client);
        }
    } catch (error) {
        logger.logError(error);
    }
};
