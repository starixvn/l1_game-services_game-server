const ConfigHelper = require("../../../Helpers/ConfigHelper");
const { notices, constants, boxes, maxBetPerChoice } = require("../../../Cron/baccarat/constant");

module.exports = (client, data) => {
  const baccarat = client.redT.game.baccarat;
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Baccarat);

  const validateBetRequest = (client, { bet, box }) => {
    if (!!bet && !!box) {
      const betsOfThisUser = Object.assign({}, baccarat.ingame[client.profile.name] || {});

      if (betsOfThisUser[box]) {
        betsOfThisUser[box] += bet;
      } else {
        betsOfThisUser[box] = bet;
      }

      const totalBets = boxes.reduce((total, box) => total + betsOfThisUser[box], 0);

      const metadata = [
        {
          condition: baccarat.remainingTime >= constants.betTime && baccarat.remainingTime < constants.resetDataTime,
          notice: notices.cannotPlaceBet,
        },
        {
          condition: baccarat.remainingTime <= constants.lockBet || baccarat.remainingTime >= constants.resetDataTime,
          notice: notices.placeBetNextRound,
        },
        {
          condition: !boxes.includes(box),
          notice: notices.placeBetFailure,
        },
        {
          condition: bet < configs.minbet,
          notice: notices.minBet(configs.minbet),
        },
        {
          condition: bet > configs.maxbet,
          notice: notices.maxBet(configs.maxbet),
        },
        {
          condition: betsOfThisUser[box] > maxBetPerChoice[box],
          notice: notices.maxBetOfThisChoice(maxBetPerChoice[box])
        },
        {
          condition: totalBets > configs.maxbet,
          notice: notices.maxBet(configs.maxbet),
        },
      ];

      const result = metadata.filter((data) => data.condition);

      if (result.length !== 0) {
        client.red({ baccarat: { notice: result[0].notice } });

        return false;
      }

      return true;
    }

    return false;
  };

  if (validateBetRequest(client, data)) {
    if (baccarat.ingame[client.profile.name]) {
      baccarat.ingame[client.profile.name][data.box] += data.bet;
      baccarat.ingame[client.profile.name].betQueue.push({ data: data, client: client });
    } else {
      const bets = boxes.reduce((result, box) => {
        if (box === data.box) {
          result[box] = data.bet;
        } else {
          result[box] = 0;
        }

        return result;
      }, {});

      baccarat.ingame[client.profile.name] = {
        name: client.profile.name,
        betQueue: [{ data: data, client: client }],
        ...bets,
      };
    }
  }
};
