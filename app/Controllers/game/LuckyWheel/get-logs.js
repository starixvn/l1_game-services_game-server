const Logger = require("./../../../web/logger");
const Constants = require("./constants");
const getSpins = require("./get-spins");

const getLogs = async (player) => {
  if (!player.session) {
    return;
  }

  const numberOfSpins = await getSpins(player.session.memberId);

  player.red({ [Constants.name]: { remainingSpins: numberOfSpins } });
};

module.exports = (player) => getLogs(player).catch(Logger.logError);
