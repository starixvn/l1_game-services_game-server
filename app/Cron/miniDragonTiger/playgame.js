let MiniDragonTiger_Phien = require('./../../Models/MiniDragonTiger/MiniDragonTiger_phien');
let GameConfigs = require('./../../Models/GameConfig/GameConfigs');

const ConfigHelper = require('./../../Helpers/ConfigHelper');
const logger = require('./../../web/logger');
const constants = require('./constants');
let Helpers = require('../../Helpers/Helpers');
let base_card = require('../../../data/card');

let io = null;

module.exports = function (obj) {
    io = obj;
    let disabled = false;
    let groundTime = constants.betTime + constants.waitTime + 1;
    io.miniDragonTiger.time = groundTime;
    configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.MiniDragonTiger);

    let gameLoop = setInterval(() => {
        try {
            if (io.miniDragonTiger.time == groundTime) {
                GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniDragonTiger }, (err, data) => {
                    if (err) {
                        logger.logError(err);
                    }

                    try {
                        configs = data;
                        ConfigHelper.updateConfig(ConfigHelper.GameTypes.MiniDragonTiger, data);

                        disabled = (data == null || !data.enabled);

                        if (disabled) {
                            io.sendAllUser({ mini: { dragon_tiger: { um: true, um_message: data.disabled_message } } });

                            GameConfigs.updateOne({ name: ConfigHelper.GameTypes.MiniDragonTiger }, { disabledround: io.miniDragonTiger.phien }, function (err, data) {
                                if (err) logger.logError(err);
                            });

                            io.miniDragonTiger.time = groundTime;

                            return;
                        }

                        io.sendAllUser({ mini: { dragon_tiger: { time_remain: io.miniDragonTiger.time } } });
                    }
                    catch (err) {
                        logger.logError(err);
                    }
                });
            }

            if (!disabled) {
                io.miniDragonTiger.time--;
            }

            if (io.miniDragonTiger.time == groundTime) {
                resetData();
            }

            if (io.miniDragonTiger.time < constants.betTime) {
                if (io.miniDragonTiger.time < 0) {
                    clearInterval(gameLoop);
                    io.miniDragonTiger.time = 0;

                    try {
                        let card = [...base_card.card];

                        card = Helpers.shuffle(card);
                        card = Helpers.shuffle(card);
                        card = Helpers.shuffle(card);

                        let result = card.slice(0, 2);
                        MiniDragonTiger_Phien.create({ 'dragon': result[0], 'tiger': result[1], 'time': new Date() }, (err, create) => {
                            if (err) {
                                logger.logError(err);
                            }

                            if (!!create) {
                                io.miniDragonTiger.phien = create.id + 1;
                                //self.thanhtoan([red1, red2, red3, red4]);
                                configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.XocXoc);
                            }
                        });
                    }
                    catch (error) {
                        logger.logError(error);
                    }
                } else {
                    updateClientData();
                }
            }
        } catch (ex) {
            logger.logError(ex);
        }
    }, 1000);

    return gameLoop;
};

let resetData = function () {
    io.miniDragonTiger.ingame = [];
    io.miniDragonTiger.data = constants.defaultData;
    io.miniDragonTiger.dataAdmin = constants.defaultData;
};

let updateClientData = function () {
    try {
        Object.values(io.users).forEach(function (users) {
            users.forEach(function (client) {
                if (client.gameEvent && client.gameEvent.viewMiniDragonTiger) {
                    client.red({ mini: { dragon_tiger: { data: io.miniDragonTiger.data } } });
                }
            });
        });

        let admin_data = { baucua: { info: io.miniDragonTiger.dataAdmin, ingame: io.miniDragonTiger.ingame } };
        Object.values(io.admins).forEach(function (admin) {
            admin.forEach(function (client) {
                if (client.gameEvent && client.gameEvent.viewBauCua) {
                    client.red(admin_data);
                }
            });
        });
    } catch (error) {
        logger.logError(error);
    }

}