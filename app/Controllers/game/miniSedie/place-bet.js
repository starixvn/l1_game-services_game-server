const configHelper = require("../../../Helpers/ConfigHelper");
const constants = require("./constants");
const noticeMessages = require("../constants/notice-messages");
const helper = require('../../../Helpers/Helpers');

const validateBetRequest = (realPlayer, { amount, box }) => {
  if (!amount || !box) {
    return false;
  }

  let miniSedieData = realPlayer.redT.miniSedie;
  let configs = configHelper.getConfigs(configHelper.GameTypes.MiniSedie);
  const betsOfThisUser = miniSedieData.ingame[realPlayer.profile.name] || {};
  const totalBets = constants.choices.reduce((total, choice) => total + betsOfThisUser[choice], 0);
  const maxBetForChoice = configs.choices_maxbet[helper.convertBetChoiceName(box)];

  const metadata = [
    {
      condition:
        miniSedieData.remainingTime <= constants.lockingBetDuration ||
        miniSedieData.remainingTime > constants.placingBetDuration,
      notice: noticeMessages.placeBetNextRound,
    },
    {
      condition:
        amount > maxBetForChoice || betsOfThisUser[box] + amount > maxBetForChoice,
      notice: noticeMessages.maxBetForChoice(maxBetForChoice),
    },
    {
      condition: amount < configs.minbet,
      notice: noticeMessages.minBet(configs.minbet),
    },
    {
      condition: amount > configs.maxbet,
      notice: noticeMessages.maxBet(configs.maxbet),
    },
    {
      condition: totalBets + amount > configs.maxbet,
      notice: noticeMessages.maxBet(configs.maxbet),
    },
  ];

  const result = metadata.filter((data) => data.condition);

  if (result.length > 0) {
    realPlayer.red({ miniSedie: { notice: result[0].notice, endBet: -1 } });
    return false;
  }

  return true;
};

module.exports = (client, data) => {
  if (validateBetRequest(client, data)) {
    let amount = data.amount >> 0;
    let box = data.box;

    let miniSedieData = client.redT.miniSedie;
    if (miniSedieData.ingame[client.profile.name]) {
      miniSedieData.ingame[client.profile.name][box] += amount;
      miniSedieData.ingame[client.profile.name].betQueue.push({
        data: data,
        client: client,
      });
    } else {
      let newData = {
        name: client.profile.name,
        ...constants.resetTotalBets,
        betQueue: [{ data: data, client: client }],
      };
      newData[box] = amount;
      miniSedieData.ingame[client.profile.name] = newData;
    }
  }
};
