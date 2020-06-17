const Logger = require("./../../../../web/logger");
const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

const KenoProVietPhien = require("./models/KenoProViet_phien");

const getRounds = async (limit) => {
  const rounds = await KenoProVietPhien.find(
    {
      result: {
        $ne: null,
      },
    },
    { _id: false, __v: false, time: false },
    { sort: { _id: -1 }, limit: limit }
  )
    .lean()
    .exec();

  return rounds.map((round) => ({
    roundId: round.id,
    settlementResult: round.settlementResult,
    result: round.result,
  }));
};

const getLogs = async (player) => {
  const maxNumberOfRounds = 100;
  const kenoProVietConfigs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProViet);
  const gameConfigs = {
    minbet: kenoProVietConfigs.minbet,
    maxbet: kenoProVietConfigs.maxbet,
    choices_maxbet: kenoProVietConfigs.choices_maxbet,
    odds: kenoProVietConfigs.odds,
  };
  const roundHistory = await getRounds(maxNumberOfRounds);

  const kenoProVietData = player.redT.kenoProViet;
  const roundId = kenoProVietData.roundId;
  const playerBetTracks = kenoProVietData.ingame[roundId] ? kenoProVietData.ingame[roundId][player.profile.name] : { betTracks: {} };

  const { betTracks: ownBets } = playerBetTracks || { betTracks: {} };

  player.red({ kenoProViet: { roundHistory, ownBets, gameConfigs } });
};

module.exports = (player) =>
  getLogs(player).catch((err) => {
    Logger.logError(err);
  });
