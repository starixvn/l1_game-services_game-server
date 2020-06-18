const ConfigHelper = require("./../../../../Helpers/ConfigHelper");
const GameConfigs = require("./../../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../../web/logger");

module.exports = (player) => {
  GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProViet }, { _id: false, enabled: true, disabled_message: true })
    .lean()
    .exec()
    .then((config) => {
      const disabled = config == null || !config.enabled;
      const disabledMessage = config == null ? "" : config.disabled_message;

      if (!player.redT) {
        return;
      }

      player.red({
        kenoProViet: {
          remainingTime: player.redT.kenoProViet.remainingTime,
          um: disabled,
          um_message: disabledMessage,
        },
      });
    })
    .catch(Logger.logError);
};
