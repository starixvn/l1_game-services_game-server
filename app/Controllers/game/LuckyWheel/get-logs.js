const LuckyWheelRound = require("./Models/LuckyWheel_phien");

const Logger = require("./../../../web/logger");
const Constants = require("./constants");
const getSpins = require("./get-spins");

const getLogs = async (player) => {
  if (!player.session) {
    return;
  }

  const spins = await getSpins(player.session.memberId);
  const spinHistory = await LuckyWheelRound.find({ uid: player.UID }, "result").lean().exec();
  const totalCoins = spinHistory?.reduce((acc, item) => {
    return acc + item.result;
  }, 0);

  const logs = { totalSpins: spins.length, spinsIds: spins, totalCoins };

  player.red({
    [Constants.name]: logs,
  });
};

module.exports = (player) => getLogs(player).catch(Logger.logError);
