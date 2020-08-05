const UserSpins = require("../../../Models/UserSpin");
const Logger = require("../../../web/logger");

const getSpins = async (memberId) => {
  const spins = await UserSpins.find({ obCustId: memberId, used: false }, "id").lean().exec();

  return spins.map((item) => item._id.toString());
};

module.exports = (memberId) => getSpins(memberId).catch((err) => Logger.logError(err));
