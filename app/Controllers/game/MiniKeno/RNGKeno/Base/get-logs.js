const Logger = require("./../../../../../web/logger");
const ConfigHelper = require("./../../../../../Helpers/ConfigHelper");

const getRounds = async (roundRepository, limit) => {
  const rounds = await roundRepository
    .find({}, "-_id id result settlementResult", { sort: { id: -1 }, limit })
    .lean()
    .exec();

  return rounds.map((round) => ({
    roundId: round.id,
    result: round.result,
    settlementResult: round.settlementResult,
  }));
};

const getLogs = async (definition, player) => {
  const maxNumberOfRounds = 100;
  const gameName = definition.name;
  const gameConfigName = definition.configName;
  const configs = ConfigHelper.getConfigs(gameConfigName);
  const gameConfigs = {
    minbet: configs.minbet,
    maxbet: configs.maxbet,
    choices_maxbet: configs.choices_maxbet,
    odds: configs.odds,
  };
  const roundHistory = await getRounds(definition.roundRepository, maxNumberOfRounds);
  const { betTracks: ownBets } = player.redT[gameName].ingame[player.profile.name] || { betTracks: {} };

  player.red({ [gameName]: { roundHistory, ownBets, gameConfigs } });
};

module.exports = (definition, player) => getLogs(definition, player).catch(Logger.logError);
