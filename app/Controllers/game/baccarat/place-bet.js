const ConfigHelper = require("../../../Helpers/ConfigHelper");
const { notices, times, boxes, maxBetPerChoice } = require("./constants");

module.exports = (client, data) => {
  const baccarat = client.redT.game.baccarat;
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Baccarat);

  const validateBetRequest = (client, { cuoc, box }) => {
    if (!!cuoc && !!box) {
      const betsOfThisUser = Object.assign({}, baccarat.ingame[client.profile.name] || {});

      if (betsOfThisUser[box]) {
        betsOfThisUser[box] += cuoc;
      } else {
        betsOfThisUser[box] = cuoc;
      }

      const totalBets = Object.values(betsOfThisUser).reduce((total, bet) => total + bet, 0);

      const metadata = [
        {
          condition: baccarat.remainingTime > times.betTime && baccarat.remainingTime < times.resetDataTime,
          notice: notices.cannotPlaceBet,
        },
        {
          condition: baccarat.remainingTime <= times.lockBetTime || baccarat.remainingTime >= times.resetDataTime,
          notice: notices.placeBetNextRound,
        },
        {
          condition: !boxes.includes(box),
          notice: notices.placeBetFailure,
        },
        {
          condition: cuoc < configs.minbet,
          notice: notices.minBet(configs.minbet),
        },
        {
          condition: cuoc > configs.maxbet,
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
      } else {
        return true;
      }
    }

    return false;
  };

  if (validateBetRequest(client, data)) {
    if (baccarat.ingame[client.profile.name]) {
      baccarat.ingame[client.profile.name][data.box] += data.cuoc;
      baccarat.ingame[client.profile.name].betQueue.push({ data: data, client: client });
    } else {
      const bets = boxes.reduce((result, box) => {
        if (box === data.box) {
          result[box] = data.cuoc;
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
