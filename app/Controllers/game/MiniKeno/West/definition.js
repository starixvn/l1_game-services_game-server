const GameIds = require("./../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

const Constants = require("./../constants");
const generateResult = require("./../shuffleNumbers");
const SettlementRules = require("./../settlementRules");

const { KenoWest_phien, KenoWest_one, KenoWest_cuoc } = require("./models");

module.exports = {
  id: GameIds.kenowest,
  name: "kenoWest",
  configName: ConfigHelper.GameTypes.KenoWest,
  viewName: "viewKenoWest",
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
  roundRepository: KenoWest_phien,
  betRepository: KenoWest_one,
  betLogRepository: KenoWest_cuoc,
};
