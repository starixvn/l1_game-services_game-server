const GlobalConfig = require("../Models/GlobalConfig");

const getOfferedGames = async (siteName) => {
  if (!siteName) {
    return [];
  }

  const siteExclusionsConfig = await GlobalConfig.findOne({ type: "game_site_exclusions" }).lean();
  const settings = siteExclusionsConfig?.configs;

  return settings
    ? Object.keys(settings)
        .filter((gameId) => settings[gameId]?.indexOf(siteName) === -1)
        .map((gameId) => parseInt(gameId))
    : [];
};

const getSiteExclusions = async (gameId) => {
  const siteExclusionsConfig = await GlobalConfig.findOne({ type: "game_site_exclusions" }).lean();

  return siteExclusionsConfig?.configs && siteExclusionsConfig.configs[gameId] ? siteExclusionsConfig.configs[gameId] : [];
};

const isEnabledStakeLevel = async () => {
  const memberStakeLevelConfig = await GlobalConfig.findOne({ type: "member_stake_level" }).lean();

  return memberStakeLevelConfig ? memberStakeLevelConfig.enabled : false;
};

module.exports = {
  getOfferedGames: getOfferedGames,
  getSiteExclusions: getSiteExclusions,
  isEnabledStakeLevel: isEnabledStakeLevel,
};
