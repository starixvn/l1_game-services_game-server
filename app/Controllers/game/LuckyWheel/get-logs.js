const SpinResult = require("./Models/Spin_Result");
const GameConfigs = require("./../../../Models/GameConfig/GameConfigs");

const Logger = require("./../../../web/logger");
const Constants = require("./constants");
const getSpins = require("./get-spins");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");

const getLogs = async (player) => {
  if (!player.session) {
    return;
  }

  const spins = await getSpins(player.session.memberId);
  const config = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.LuckyWheel });
  const disabledMessage = config === null ? "" : config.disabled_message;
  const disabled = config === null || !config.enabled;

  let logs = { choices: Constants.choices, um: disabled, um_message: disabledMessage, totalCoins: 0, availSpins: 0 };

  if (spins) {
    const spinHistory = await SpinResult.find({ uid: player.UID }, "result").lean().exec();
    const totalCoins = spinHistory?.reduce((acc, item) => {
      return acc + item.result;
    }, 0);

    logs.totalCoins = totalCoins;
    logs.availSpins = spins.availSpins;
  }

  player.red({
    [Constants.name]: logs,
  });
};

module.exports = (player) => getLogs(player).catch(Logger.logError);
