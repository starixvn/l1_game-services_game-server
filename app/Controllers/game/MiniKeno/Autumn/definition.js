const GameIds = require("./../../../../../config/appConfigs").gameIds;

const ConfigHelper = require("./../../../../Helpers/ConfigHelper");

const Constants = require("./../constants");
const generateResult = require("./../shuffleNumbers");
const SettlementRules = require("./../settlementRules");

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
  additionalValidationCriteria: [],
  choices: Constants.choices,
  queueingBet: false,
  defaultBetTracks: () => ({ ...Constants.defaultBetTracks }),
  defaultTotalBets: () => ({ ...Constants.defaultBetTracks }),
  generateResult: () => generateResult(20, 80),
  settlementRules: SettlementRules.full,
  roundRepository: KenoAutumn_phien,
  betRepository: KenoAutumn_one,
  betLogRepository: KenoAutumn_cuoc,
};
