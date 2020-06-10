const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { KenoAutumn_phien, KenoAutumn_one, KenoAutumn_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenoautumn,
  name: "kenoAutumn",
  configName: ConfigHelper.GameTypes.KenoAutumn,
  viewName: "viewKenoAutumn",
  durations: {
    wholeRound: 44,
    placingBets: 35,
    lockingBet: 5,
  },
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRuleSets.full,
  roundRepository: KenoAutumn_phien,
  betRepository: KenoAutumn_one,
  betLogRepository: KenoAutumn_cuoc,
};
