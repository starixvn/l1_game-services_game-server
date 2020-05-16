const Logger = require("./../../../web/logger");

const MiniSediePhien = require("./models/MiniSedie_phien");
const MiniSedieUser = require("./models/MiniSedie_user");

const getRounds = async (limit) =>
  await MiniSediePhien.find({}, {}, { sort: { _id: -1 }, limit: limit })
    .lean()
    .exec();

const checkExistingMiniSedieUser = async (uid) => await MiniSedieUser.find({ uid }, { _id: true }).limit(1).exec();

const getLogs = async (realPlayer) => {
  const maxNumberOfRounds = 100;
  const roundHistory = await getRounds(maxNumberOfRounds);
  const ownBets = realPlayer.redT.miniSedie.ingame[realPlayer.profile.name];
  const uid = realPlayer.UID;

  if (!checkExistingMiniSedieUser(uid)) {
    MiniSedieUser.create({ uid });
  }

  realPlayer.red({ miniSedie: { roundHistory, ownBets } });
};

module.exports = (client) => getLogs(client).catch(Logger.logError);
