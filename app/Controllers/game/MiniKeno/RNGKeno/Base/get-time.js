const Logger = require("./../../../../../web/logger");

module.exports = (definition, player) => {
  if (!player.redT) {
    return;
  }

  const gameConfigName = definition.configName;

  GameConfigs.findOne({ name: gameConfigName }, { _id: false, enabled: true, disabled_message: true })
    .lean()
    .exec()
    .then((config) => {
      const gameName = definition.name;
      const disabled = config == null || !config.enabled;
      const disabledMessage = config == null ? "" : config.disabled_message;

      player.red({
        [gameName]: {
          remainingTime: player.redT[gameName].remainingTime,
          um: disabled,
          um_message: disabledMessage,
        },
      });
    })
    .catch(Logger.logError);
};
