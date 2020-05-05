const { queueProcessing, notices, boxes } = require("./constants");
const gameIds = require("./../../../../config/appConfigs").gameIds;
const balanceApi = require("./../../../apis/balanceApi");
const betChoiceMapper = require("./../../../apis/betChoiceMapper");
const BaccaratBet = require("../../../Models/Baccarat/baccarat-cuoc");
const logger = require('../../../web/logger');

const processPlacingBet = (client, data) => new Promise((resolve, reject) => {
  if (client.redT == null || client.redT.game == null || client.redT.game.baccarat == null) {
    return;
  }

  const { cuoc, red, box } = data;
  const baccarat = client.redT.game.baccarat;

  const placeBetSuccess = (user) => {
    BaccaratBet
      .findOne({ uid: client.UID, phien: baccarat.phien, red })
      .exec()
      .then((bet) => {
        if (bet) {
          bet[box] += cuoc;

          return bet.save();
        } else {
          const newBet = { uid: client.UID, name: client.profile.name, phien: baccarat.phien, red, time: new Date() };

          if (client.session) {
            newBet.memberId = client.session.memberId;
            newBet.siteId = client.session.siteId;
          }

          const update = { [box]: cuoc };

          return BaccaratBet.updateOne(
            { uid: client.UID, phien: baccarat.phien, red },
            { $inc: update, $setOnInsert: newBet },
            { upsert: true, setDefaultsOnInsert: true }
          );
        }
      })
      .then(() => {
        baccarat.data.red[box] += cuoc;
        baccarat.dataAdmin.red[box] += cuoc;
        baccarat.chip[box][cuoc] += 1;

        if (baccarat.players[client.UID]) {
          baccarat.players[client.UID].red = user.red;
        }

        const betsOfThisUser = baccarat.ingame[client.profile.name];
        const meCuoc = boxes.reduce((result, currentBox) => {
          result[currentBox] = betsOfThisUser[currentBox];
          return result;
        }, {});

        Object.values(baccarat.clients).forEach((user) => {
          if (client.UID !== user.UID) {
            user.red({ baccarat: { chip: { playerId: client.UID, box, cuoc, red: user.red } } });
          } else {
            user.red({
              baccarat: {
                mechip: { box, cuoc: data.cuoc },
                me: { red: meCuoc }
              },
              user: {
                red: user.red,
                xu: user.xu,
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
    resolve();
  };

  data.inSufficientBalance = { baccarat: { notice: notices.notEnoughMonney } };

  data.gameId = gameIds.baccarat;
  data.gameRoundId = baccarat.phien;
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
      if (userBet.processRunning == null && userBet.cuocQueue && userBet.cuocQueue.length > 0) {
        userBet.processRunning = true;
        const { data, client } = userBet.cuocQueue.shift();

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
