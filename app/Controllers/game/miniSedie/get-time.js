const ConfigHelper = require("./../../../Helpers/ConfigHelper");
const GameConfigs = require("./../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../web/logger");

module.exports = (realPlayer) => {
  if (!realPlayer.redT) {
    return;
  }

  GameConfigs.findOne({ name: ConfigHelper.GameTypes.MiniSedie }, { _id: false, enabled: true, disabled_message: true })
    .lean()
    .exec()
    .then((config) => {
      var disabled = config == null || !config.enabled;
      var disabledMessage = config == null ? "" : config.disabled_message;

      realPlayer.red({
        miniSedie: {
          remainingTime: realPlayer.redT.miniSedie.remainingTime,
          um: disabled,
          um_message: disabledMessage,
        },
      });
    })
    .catch(Logger.logError);
};
