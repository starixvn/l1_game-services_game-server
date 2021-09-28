const GlobalConfig = require("../Models/GlobalConfig");
const GameConfigs = require("../Models/GameConfig/GameConfigs");

const checkSuperPlayers = async (playerName) => await GlobalConfig.exists({ type: "super_players", "configs.names": playerName });

const getBetaGames = async () => GameConfigs.find({ isBeta: true }, "gameId").lean().exec();

const getOfferedGames = async (siteName, username) => {
  if (!siteName) {
    return [];
  }

  const siteExclusionsConfig = await GlobalConfig.findOne({ type: "game_site_exclusions" }).lean();
  const settings = siteExclusionsConfig?.configs;

  const lowerCaseSiteName = siteName.toLowerCase();

  const isSuperPlayers = await checkSuperPlayers(username);
  const betaGames = await getBetaGames();

  return settings
    ? Object.keys(settings)
        .filter((gameId) => {
          const isBeta = betaGames.some((g) => g.gameId?.toString() === gameId);
          return (isBeta && isSuperPlayers) || (!isBeta && !settings[gameId]?.some((x) => x.toLowerCase() === lowerCaseSiteName));
        })
        .map((gameId) => parseInt(gameId))
    : [];
};

const getSiteExclusions = async (gameId) => {
  const siteExclusionsConfig = await GlobalConfig.findOne({ type: "game_site_exclusions" }).lean();

  return siteExclusionsConfig?.configs && siteExclusionsConfig.configs[gameId] ? siteExclusionsConfig.configs[gameId] : [];
};

module.exports = {
  getOfferedGames: getOfferedGames,
  getSiteExclusions: getSiteExclusions,
  isSuperPlayers: checkSuperPlayers,
};
