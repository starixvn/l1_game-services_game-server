const GameIds = require("./../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

const Constants = require("./../constants");
const generateResult = require("./../shuffleNumbers");
const SettlementRules = require("./../settlementRules");

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
  additionalValidationCriteria: [],
  choices: Constants.choices,
  queueingBet: false,
  defaultBetTracks: () => ({ ...Constants.defaultBetTracks }),
  defaultTotalBets: () => ({ ...Constants.defaultBetTracks }),
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRules.full,
  roundRepository: KenoSpring_phien,
  betRepository: KenoSpring_one,
  betLogRepository: KenoSpring_cuoc,
};
