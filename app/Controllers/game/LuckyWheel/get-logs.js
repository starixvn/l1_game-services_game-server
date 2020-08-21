const SpinResult = require("./Models/Spin_Result");

const Logger = require("./../../../web/logger");
const Constants = require("./constants");
const getSpins = require("./get-spins");

const getLogs = async (player) => {
  if (!player.session) {
    return;
  }

  const spins = await getSpins(player.session.memberId);
  let logs = {};

  if (spins) {
    const spinHistory = await SpinResult.find({ uid: player.UID }, "result").lean().exec();
    const totalCoins = spinHistory?.reduce((acc, item) => {
      return acc + item.result;
    }, 0);

    logs = { availSpins: spins.availSpins, totalCoins };
  }

  player.red({
    [Constants.name]: logs,
  });
};

module.exports = (player) => getLogs(player).catch(Logger.logError);
