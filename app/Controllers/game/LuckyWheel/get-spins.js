const Spins = require("./Models/Spin");
const Logger = require("../../../web/logger");

const getSpins = async (memberId) => {
  const spins = await Spins.findOne({ memberId: memberId, enabled: true }).lean().exec();

  return spins;
};
module.exports = (memberId) => getSpins(memberId).catch((err) => Logger.logError(err));
