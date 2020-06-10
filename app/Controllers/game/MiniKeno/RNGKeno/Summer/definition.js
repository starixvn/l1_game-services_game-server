const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { KenoSummer_phien, KenoSummer_one, KenoSummer_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenosummer,
  name: "kenoSummer",
  configName: ConfigHelper.GameTypes.KenoSummer,
  viewName: "viewKenoSummer",
  durations: {
    wholeRound: 44,
    placingBets: 35,
    lockingBet: 5,
  },
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRuleSets.full,
  roundRepository: KenoSummer_phien,
  betRepository: KenoSummer_one,
  betLogRepository: KenoSummer_cuoc,
};
