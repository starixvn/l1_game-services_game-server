const GameIds = require("./../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

const Constants = require("./../constants");
const generateResult = require("./../shuffleNumbers");
const SettlementRules = require("./../settlementRules");

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
  additionalValidationCriteria: [],
  choices: Constants.choices,
  queueingBet: false,
  defaultBetTracks: () => ({ ...Constants.defaultBetTracks }),
  defaultTotalBets: () => ({ ...Constants.defaultBetTracks }),
  generateResult: () => generateResult(20, 80),
  settle: SettlementRules.full,
  roundRepository: KenoWinter_phien,
  betRepository: KenoWinter_one,
  betLogRepository: KenoWinter_cuoc,
};
