const ConfigHelper = require("./../../../../Helpers/ConfigHelper");
const NoticeMessages = require("./../../constants/notice-messages");
const Constants = require("./constants");

//TODO validate bet on next 30 rounds besides locking bet duration
const validateBetRequest = (player, { amount, betChoice }) => {
  if (!amount || !betChoice) {
    return false;
  }

  const kenoProVietData = player.redT.kenoProViet;
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProViet);
  const { betTracks } = kenoProVietData.ingame[player.profile.name] || { betTracks: {} };
  const totalAmount = Constants.choices.reduce((total, choice) => total + (betTracks[choice] || 0), 0) + amount;
  const maxBetPerChoice = configs.choices_maxbet[betChoice];
  const kenoProVietTime = Constants.durations.placingBets;

  const criteria = [
    {
      failure: kenoProVietData.remainingTime >= Constants.placingBetDuration && kenoProVietData.remainingTime <= kenoProVietTime,
      notice: NoticeMessages.cannotPlaceBet,
    },
    {
      failure: kenoProVietData.remainingTime <= Constants.lockingBetDuration || kenoProVietData.remainingTime > kenoProVietTime,
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
    player.red({ kenoProViet: { notice: failedCriterion.notice, endBet: -1 } });

    return false;
  }

  return true;
};

//TODO need input round id
module.exports = (player, payload) => {
  if (validateBetRequest(player, payload)) {
    const name = player.profile.name;
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const kenoProVietData = player.redT.kenoProViet;

    if (kenoProVietData.ingame[name]) {
      kenoProVietData.ingame[name].betTracks[betChoice] += amount;

      //TODO send estimated time for betting round
      kenoProVietData.ingame[name].betQueue.push({ player, payload });
    } else {
      const newPlayer = {
        name: player.profile.name,
        betTracks: { ...Constants.resetTotalBets },
        betQueue: [{ player, payload }],
      };

      newPlayer.betTracks[betChoice] = amount;
      kenoProVietData.ingame[name] = newPlayer;
    }
  }
};
