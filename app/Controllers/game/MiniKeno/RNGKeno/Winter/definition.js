const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { KenoWinter_phien, KenoWinter_one, KenoWinter_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenowinter,
  name: "kenoWinter",
  configName: ConfigHelper.GameTypes.KenoWinter,
  viewName: "viewKenoWinter",
  durations: {
    wholeRound: 44,
    placingBets: 35,
    lockingBet: 5,
  },
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRuleSets.full,
  roundRepository: KenoWinter_phien,
  betRepository: KenoWinter_one,
  betLogRepository: KenoWinter_cuoc,
};
