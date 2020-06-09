const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { RNGKenoMax_phien, RNGKenoMax_one, RNGKenoMax_cuoc } = require("./models");

module.exports = {
  id: GameIds.rngkenomax,
  name: "rngKenoMax",
  configName: ConfigHelper.GameTypes.RNGKenoMax,
  viewName: "viewRNGKenoMax",
  durations: {
    wholeRound: 60,
    placingBets: 50,
    lockingBet: 5,
  },
  generateResult: generateResult(20, 80),
  settlementRules: SettlementRuleSets.full,
  roundRepository: RNGKenoMax_phien,
  betRepository: RNGKenoMax_one,
  betLogRepository: RNGKenoMax_cuoc,
};
