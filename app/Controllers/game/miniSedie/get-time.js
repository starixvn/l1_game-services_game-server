const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const ConfigHelper = require("../../../Helpers/ConfigHelper");
const Logger = require("./../../../web/logger");

module.exports = (client) => {
  console.log("gettime");
  GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniSedie })
    .exec()
    .then((config) => {
      if (client.redT == null) {
        return;
      }

      var disabled = config == null || !config.enabled;
      var disabledMessage = config == null ? "" : config.disabled_message;
      console.log("xxx");
      client.red({
        miniSedie: {
          remainingTime: client.redT.miniSedie.time,
          um: disabled,
          um_message: disabledMessage,
        },
      });
    })
    .catch((error) => {
      console.log(error);
      Logger.logError(error);
    });
};
