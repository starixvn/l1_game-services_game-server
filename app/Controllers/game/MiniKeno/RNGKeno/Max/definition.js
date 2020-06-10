const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { KenoMax_phien, KenoMax_one, KenoMax_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenomax,
  name: "kenoMax",
  configName: ConfigHelper.GameTypes.KenoMax,
  viewName: "viewKenoMax",
  durations: {
    wholeRound: 59,
    placingBets: 50,
    lockingBet: 5,
  },
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRuleSets.full,
  roundRepository: KenoMax_phien,
  betRepository: KenoMax_one,
  betLogRepository: KenoMax_cuoc,
};
