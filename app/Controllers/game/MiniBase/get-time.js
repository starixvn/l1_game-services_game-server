const ConfigHelper = require("./../../../Helpers/ConfigHelper");

module.exports = (definition, player) => {
  const configs = ConfigHelper.getConfigs(definition.configName);
  const gameName = definition.name;
  const disabled = !configs || !configs.enabled;
  const disabledMessage = configs ? configs.disabled_message : "";

  if (player.red && player.redT) {
    player.red({
      [gameName]: {
        remainingTime: player.redT[gameName].remainingTime,
        um: disabled,
        um_message: disabledMessage,
      },
    });
  }
};
