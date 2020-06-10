const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { KenoSpring_phien, KenoSpring_one, KenoSpring_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenospring,
  name: "kenoSpring",
  configName: ConfigHelper.GameTypes.KenoSpring,
  viewName: "viewKenoSpring",
  durations: {
    wholeRound: 44,
    placingBets: 35,
    lockingBet: 5,
  },
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRuleSets.full,
  roundRepository: KenoSpring_phien,
  betRepository: KenoSpring_one,
  betLogRepository: KenoSpring_cuoc,
};
