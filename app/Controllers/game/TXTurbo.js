const logger = require('./../../web/logger');
const GameConfigs = require('../../Models/GameConfig/GameConfigs');

let getLogs = require('./TXTurbo/getLogs');
let cuoc = require('./TXTurbo/cuoc');
let getPhien = require('./TXTurbo/getPhien');
let getLog = require('./TXTurbo/getLog');
let getTop = require('./TXTurbo/getTop');
let getNew = require("./TXTurbo/getNew");

module.exports = function (client, data) {
    try {
        if (void 0 !== data.view) {
            client.gameEvent.viewTaiXiuTurbo = !!data.view;
        }

        if (!!data.get_time) {
            GameConfigs.findOne({ name: "txturbo" }, function (err, data) {
                if (err) {
                    logger.logError(err);
                }

                var disabled = (data == null || !data.enabled);
                client.red({ taixiu_turbo: { time_remain: client.redT.TXTurbo_time, um: disabled } });
            });
        }

        if (!!data.getLogs) {
            getLogs(client);
        }
        if (!!data.cuoc) {
            cuoc(client, data.cuoc);
        }
        if (!!data.get_phien) {
            getPhien(client, data.get_phien);
        }
        if (!!data.get_log) {
            getLog(client, data.get_log);
        }
        if (!!data.get_top) {
            getTop(client, data.get_top);
        }
        if (!!data.get_new) {
            getNew(client);
        }
    } catch (error) {
        logger.logError(error);
    }
};
