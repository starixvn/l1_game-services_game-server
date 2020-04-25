const GameConfigs = require('../../../Models/GameConfig/GameConfigs');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
let cuoc = require('./cuoc').miniDragonTigerCuoc;
let getLogs = require('./getLogs');
let viewLogs = require('./viewLogs');
const logger = require('./../../../web/logger');

module.exports = function (client, data) {
    if (void 0 !== data.view) {
        client.gameEvent.viewMiniDragonTiger = !!data.view;
    }

    f(!!data.get_time) {
        GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniDragonTiger }, function (err, data) {
            try {
                if (err) {
                    logger.logError(err);
                }

                var disabled = (data == null || !data.enabled);
                client.red({ mini: { dragon_tiger: { time_remain: client.redT.miniDragonTiger.time, um: disabled, um_message: data.disabled_message } } });

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
        viewLogs(client, data.viewlogs)
    }
};