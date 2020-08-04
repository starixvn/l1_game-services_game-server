const UserSpins = require("./../../../Models/UserSpin");
const Logger = require("./../../../web/logger");

const getSpins = async (memberId) => {
  const spins = await UserSpins.find({ obCustId : memberId , used: false})
    .lean()
    .exec();

  return spins;
};

module.exports = (memberId) => getSpins(memberId).catch(Logger.logError);