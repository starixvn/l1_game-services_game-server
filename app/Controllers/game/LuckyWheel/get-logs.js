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
  const enabled = (await GameConfigs.findOne({ name: ConfigHelper.GameTypes.LuckyWheel })).enabled;
  let logs = { choices: Constants.choices, enabled };

  if (spins) {
    const spinHistory = await SpinResult.find({ uid: player.UID }, "result").lean().exec();
    const totalCoins = spinHistory?.reduce((acc, item) => {
      return acc + item.result;
    }, 0);

    logs = { choices: Constants.choices, availSpins: spins.availSpins, totalCoins, enabled };
  }

  player.red({
    [Constants.name]: logs,
  });
};

module.exports = (player) => getLogs(player).catch(Logger.logError);
