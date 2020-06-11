const GameIds = require("./../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

const Constants = require("./../constants");
const generateResult = require("./../shuffleNumbers");
const SettlementRules = require("./../settlementRules");

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
  additionalValidationCriteria: [],
  choices: Constants.choices,
  queueingBet: false,
  defaultBetTracks: () => ({ ...Constants.defaultBetTracks }),
  defaultTotalBets: () => ({ ...Constants.defaultBetTracks }),
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRules.full,
  roundRepository: KenoSummer_phien,
  betRepository: KenoSummer_one,
  betLogRepository: KenoSummer_cuoc,
};
