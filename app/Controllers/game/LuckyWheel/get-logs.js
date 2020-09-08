const GameConfigs = require("./../../../Models/GameConfig/GameConfigs");
const UserInfo = require("../../../Models/UserInfo");

const Constants = require("./constants");
const getSpins = require("./get-spins");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");
const Logger = require("../../../web/logger");

const getLogs = async (player) => {
  if (!player.session) {
    return;
  }
  try {
    const spins = await getSpins(player.session.memberId);
    const user = await UserInfo.findOne({ id: player.UID }).lean().exec();
    const config = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.LuckyWheel }).lean().exec();
    const disabledMessage = config === null ? "" : config.disabled_message;
    const disabled = config === null || !config.enabled;

    if (user) {
      const logs = { choices: Constants.choices, um: disabled, um_message: disabledMessage, totalCoins: 0, availSpins: 0 };

      if (spins) {
        logs.totalCoins = user.scoins;
        logs.availSpins = spins.availSpins;
      }

      player.red({
        [Constants.name]: logs,
      });
    }
  } catch (error) {
    Logger.logError(error);
  }
};

module.exports = {
  getLogs,
};
