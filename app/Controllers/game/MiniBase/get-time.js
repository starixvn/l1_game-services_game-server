const ConfigHelper = require("./../../../Helpers/ConfigHelper");
const GameConfigs = require("./../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../web/logger");

module.exports = (definition, player) => {
  GameConfigs.findOne({ name: definition.configName }, { _id: false, enabled: true, disabled_message: true })
    .lean()
    .exec()
    .then((config) => {
      const gameName = definition.name;
      const disabled = config == null || !config.enabled;
      const disabledMessage = config == null ? "" : config.disabled_message;

      if (player && player.redT) {
        player.red({
          [gameName]: {
            remainingTime: player.redT[gameName].remainingTime,
            um: disabled,
            um_message: disabledMessage,
          },
        });
      }
    })
    .catch(Logger.logError);
};
