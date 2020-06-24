const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

module.exports = (player) => {
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProViet);
  const disabled = !configs || !configs.enabled;
  const disabledMessage = configs ? configs.disabled_message : "";

  if (player.red && player.redT) {
    player.red({
      kenoProViet: {
        remainingTime: player.redT.kenoProViet.remainingTime,
        um: disabled,
        um_message: disabledMessage,
      },
    });
  }
};
