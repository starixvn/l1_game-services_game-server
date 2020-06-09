const ConfigHelper = require("./../../../../../Helpers/ConfigHelper");

const NoticeMessages = require("./../../../constants/notice-messages");

const Constants = require("./constants");

const validateBetRequest = (definition, player, { amount, betChoice }) => {
  if (!amount || !betChoice) {
    return false;
  }

  const gameName = definition.name;
  const gameData = player.redT[gameName];
  const configs = ConfigHelper.getConfigs(definition.configName);
  const { betTracks } = gameData.ingame[player.profile.name] || { betTracks: {} };
  const totalAmount = Constants.choices.reduce((total, choice) => total + (betTracks[choice] || 0), 0) + amount;
  const maxBetPerChoice = configs.choices_maxbet[betChoice] || 0;

  const criteria = [
    {
      failure: gameData.remainingTime <= definition.durations.lockingBet || gameData.remainingTime > definition.durations.placingBets,
      notice: NoticeMessages.placeBetNextRound,
    },
    {
      failure: amount > maxBetPerChoice || betTracks[betChoice] + amount > maxBetPerChoice,
      notice: NoticeMessages.maxBetForChoice(maxBetPerChoice),
    },
    {
      failure: amount < configs.minbet,
      notice: NoticeMessages.minBet(configs.minbet),
    },
    {
      failure: amount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
    {
      failure: totalAmount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
  ];

  const failedCriterion = criteria.find((criterion) => criterion.failure);

  if (failedCriterion) {
    player.red({ [gameName]: { notice: failedCriterion.notice, endBet: -1 } });

    return false;
  }

  return true;
};

module.exports = (definition, player, payload) => {
  if (validateBetRequest(definition, player, payload)) {
    const name = player.profile.name;
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const gameData = player.redT[definition.name];

    if (gameData.ingame[name]) {
      gameData.ingame[name].betTracks[betChoice] += amount;
      gameData.ingame[name].betQueue.push({ player, payload });
    } else {
      const newPlayer = {
        name: player.profile.name,
        betTracks: { ...Constants.resetTotalBets },
        betQueue: [{ player, payload }],
      };

      newPlayer.betTracks[betChoice] = amount;
      gameData.ingame[name] = newPlayer;
    }
  }
};
