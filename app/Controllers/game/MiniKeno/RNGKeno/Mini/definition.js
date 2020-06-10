const GameIds = require("../../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("../../../../../Helpers/ConfigHelper");

const generateResult = require("../Base/shuffleNumbers");
const SettlementRuleSets = require("../Base/settlementRules");

const { KenoMini_phien, KenoMini_one, KenoMini_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenomini,
  name: "kenoMini",
  configName: ConfigHelper.GameTypes.KenoMini,
  viewName: "viewKenoMini",
  durations: {
    wholeRound: 59,
    placingBets: 50,
    lockingBet: 5,
  },
  generateResult: () => generateResult(10, 40),
  settlementRules: SettlementRuleSets.mini,
  roundRepository: KenoMini_phien,
  betRepository: KenoMini_one,
  betLogRepository: KenoMini_cuoc,
};
