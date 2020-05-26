const Logger = require("./../../../web/logger");

const MiniSediePhien = require("./models/MiniSedie_phien");
const MiniSedieUser = require("./models/MiniSedie_user");
const Constants = require("./constants");

const getRounds = async (limit) => {
  const rounds = await MiniSediePhien.find({}, { _id: false, __v: false, time: false }, { sort: { _id: -1 }, limit: limit })
    .lean()
    .exec();

  return rounds.map((round) => ({
    id: round.id,
    settlementResult: round.settlementResult,
    result: {
      red1: round.red1,
      red2: round.red2,
      red3: round.red3,
      red4: round.red4,
    },
  }));
};

const checkExistingMiniSedieUser = async (uid) => await MiniSedieUser.find({ uid }, { _id: true }).limit(1).exec();

const getLogs = async (player) => {
  const maxNumberOfRounds = 100;
  const odds = Constants.odds;
  const roundHistory = await getRounds(maxNumberOfRounds);
  const { betTracks: ownBets } = player.redT.miniSedie.ingame[player.profile.name] || { betTracks: {} };
  const uid = player.UID;

  if (!checkExistingMiniSedieUser(uid)) {
    MiniSedieUser.create({ uid });
  }

  player.red({ miniSedie: { odds, roundHistory, ownBets } });
};

module.exports = (player) => getLogs(player).catch(Logger.logError);
