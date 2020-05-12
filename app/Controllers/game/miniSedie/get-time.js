const GameConfigs = require('../../../Models/GameConfig/GameConfigs');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const logger = require('./../../../web/logger');

module.exports = (client) => {
    GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniSedie }, function (err, data) {
        try {
            if (err) {
                logger.logError(err);
            }

            if (client.redT == null) {
                return;
            }

            var disabled = (data == null || !data.enabled);
            var disabledMessage = data == null ? "" : data.disabled_message;
            client.red({ miniSedie: { time_remain: client.redT.MiniSedie.time, um: disabled, um_message: disabledMessage } });
        } catch (ex) {
            logger.logError(ex);
        }
    });
};