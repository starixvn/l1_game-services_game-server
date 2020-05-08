const { queueProcessing, notices, boxes } = require("../../../Cron/baccarat/constant");
const gameIds = require("../../../../config/appConfigs").gameIds;
const balanceApi = require("../../../apis/balanceApi");
const betChoiceMapper = require("../../../apis/betChoiceMapper");
const BaccaratBet = require("../../../Models/Baccarat/baccarat-cuoc");
const logger = require('../../../web/logger');

const processPlacingBet = (client, data) => new Promise((resolve, reject) => {
  if (client.redT == null || client.redT.game == null || client.redT.game.baccarat == null) {
    return;
  }

  const { bet, box } = data;
  const cuoc = bet;
  const baccarat = client.redT.game.baccarat;

  const placeBetSuccess = (user) => {
    BaccaratBet
      .findOne({ uid: client.UID, phien: baccarat.roundId })
      .exec()
      .then((bet) => {
        if (bet) {
          bet[box] += cuoc;

          return bet.save();
        } else {
          const newBet = { uid: client.UID, name: client.profile.name, phien: baccarat.roundId, time: new Date() };

          if (client.session) {
            newBet.memberId = client.session.memberId;
            newBet.siteId = client.session.siteId;
          }

          const update = {
            [box]: cuoc
          };

          return BaccaratBet.updateOne(
            { uid: client.UID, phien: baccarat.roundId },
            { $inc: update, $setOnInsert: newBet },
            { upsert: true, setDefaultsOnInsert: true }
          );
        }
      })
      .then(() => {
        baccarat.totalBets[box] += cuoc;
        baccarat.totalBetsAdmin[box] += cuoc;
        baccarat.chips[box][cuoc] += 1;

        if (baccarat.players[client.UID]) {
          baccarat.players[client.UID].red = user.red;
        }

        const betsOfThisUser = baccarat.ingame[client.profile.name];
        const ownBet = boxes.reduce((result, currentBox) => {
          result[currentBox] = betsOfThisUser[currentBox];
          return result;
        }, {});

        Object.values(baccarat.clients).forEach((user) => {
          if (client.UID !== user.UID) {
            user.red({ baccarat: { playerChip: { playerId: client.UID, box, bet: cuoc, red: user.red } } });
          } else {
            user.red({
              baccarat: {
                ownChip: { box, bet: cuoc },
                ownBet: ownBet,
                endBet: cuoc
              },
              user: {
                red: user.red
              },
            });
          }
        });
      })
      .then(() => resolve())
      .catch(error => reject(error));
  };

  const placeBetFailed = () => {
    const currentUser = baccarat.ingame[client.profile.name];
    currentUser[box] -= cuoc;

    client.red({ baccarat: { endBet: -1 } })

    resolve();
  };

  data.inSufficientBalance = { baccarat: { notice: notices.notEnoughMonney } };

  data.gameId = gameIds.baccarat;
  data.gameRoundId = baccarat.roundId;
  data.choiceId = betChoiceMapper.convertBaccarat(box);

  balanceApi.placeBet(
    { id: client.UID },
    data,
    client,
    placeBetSuccess,
    placeBetFailed
  );
});

const processBetQueue = (io) => {
  if (io.game.baccarat.ingame) {
    Object.values(io.game.baccarat.ingame).reduce((promise, userBet) => {
      if (userBet.processRunning == null && userBet.betQueue && userBet.betQueue.length > 0) {
        userBet.processRunning = true;
        const { data, client } = userBet.betQueue.shift();

        return promise
          .then(() => processPlacingBet(client, data))
          .catch(error => logger.logError(error))
          .then(() => {
            userBet.processRunning = null;
          })
      } else {
        return promise;
      }
    }, Promise.resolve());
  }
};

module.exports = (io) => {
  const processFunc = () => {
    processBetQueue(io);

    setTimeout(processFunc, queueProcessing.timeout);
  };

  setTimeout(processFunc, queueProcessing.timeout);
};
