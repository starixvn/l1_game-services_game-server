const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const ConfigHelper = require("../../../Helpers/ConfigHelper");
const Logger = require("./../../../web/logger");

module.exports = (client) => {
  GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniSedie })
    .exec()
    .then((config) => {
      if (client.redT == null) {
        return;
      }

      var disabled = config == null || !config.enabled;
      var disabledMessage = config == null ? "" : config.disabled_message;
      client.red({
        miniSedie: {
          remainingTime: client.redT.miniSedie.remainingTime,
          um: disabled,
          um_message: disabledMessage,
        },
      });
    })
    .catch((error) => {
      Logger.logError(error);
    });
};
