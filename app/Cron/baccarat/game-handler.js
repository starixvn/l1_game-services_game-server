const constants = require("./constant");
const BaccaratGame = require("./baccarat-game");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const baseCard = require("../../../data/card");
const logger = require('./../../web/logger');
const Helpers = require("../../Helpers/Helpers");
const BaccaratPhien = require("../../Models/Baccarat/baccarat-phien");
const GameConfigs = require('./../../Models/GameConfig/GameConfigs');
const BaccaratCuoc = require('./../../Models/Baccarat/baccarat-cuoc');
const BaccaratUser = require('./../../Models/Baccarat/baccarat-user');
const User = require('./../../Controllers/User');

const getCards = () => {
  let cards = [...baseCard.card];

  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);

  return cards;
};

const onBetTimeEnd = io => {
  if (io.baccarat.time === constants.resetDataTime) {
    io.baccarat.data = { player: 0, banker: 0, big: 0, small: 0, tie: 0 };
    io.baccarat.dataAdmin = { player: 0, banker: 0, big: 0, small: 0, tie: 0 };
    io.ingame.red = {};
  }
};

const onBetTime = io => {
  try {
    const baccarat = io.baccarat;

    if (baccarat && baccarat.time == constants.getGameConfigTime) {
      GameConfigs.findOne({ name: ConfigHelper.GameTypes.Baccarat }, function (err, data) {
        if (err) {
          logger.logError(err);
        }

        baccarat.disabled = data == null || !data.enabled;

        ConfigHelper.updateConfig(ConfigHelper.GameTypes.Baccarat, data);

        if (baccarat.disabled) {
          Object.values(baccarat.clients).forEach(function (client) {
            client.red && client.red({ baccarat: { um: true, um_message: data.disabled_message } });
          });

          GameConfigs.updateOne({ name: ConfigHelper.GameTypes.Baccarat }, { disabledround: baccarat.phien }, function (err, data) {
            if (err) logger.logError(err);
          });

          //reset time
          baccarat.time = constants.getGameConfigTime;
        }
      });
    }

    if (baccarat && baccarat.time < constants.betTime && baccarat.time >= 0) {

      Object.values(baccarat.clients).forEach((client) => {
        client.red({ baccarat: { client: baccarat.data } });
      });

      if (io.admins) {
        let adminData = { baccarat: { info: baccarat.dataAdmin, ingame: baccarat.ingame } };

        Object.values(io.admins).forEach(function (admin) {
          admin.forEach(function (client) {
            if (client.gameEvent !== void 0
              && client.gameEvent.viewBaccarat !== void 0
              && client.gameEvent.viewBaccarat) {
              client.red(adminData);
            }
          });
        });

      }

    }

    if (!baccarat.disabled) {
      baccarat.time--;
    }
  } catch (error) {
    logger.logError(error);
  }
};

const createUpdateData = (totalWin, winAmount, totalLoss, totalBet) => {
  let update = { red: 0, redWin: 0, redLost: 0, redPlay: 0 };
  let updateGame = { win: 0, lost: 0, play: 0 };

  if (totalWin > 0) {
    update.red = totalWin;
  }

  if (winAmount > 0) {
    update.redWin = updateGame.win = winAmount;
  }

  if (totalLoss > 0) {
    update.redLost = updateGame.lost = totalLoss;
  }

  update.redPlay = updateGame.play = totalBet;

  return { update, updateGame };
}

const pushSettleResultToClients = (totalWin, baccarat, bet, totalLoss, io) => {
  let status = {};
  const userId = bet.uid;

  if (totalWin > 0) {
    status = { win: true, bet: totalWin };
    status.boxs = boxs;
    baccarat.winClients[userId] = status;
    if (baccarat.players[userId]) {
      baccarat.players[userId].red += totalWin;
    }
  }
  else {
    status = { win: false, bet: totalLoss };
  }

  if (void 0 !== baccarat.clients[userId]) {
    baccarat.clients[userId].red({ baccarat: { status: status } });
  }
  else {
    if (status.win && void 0 !== io.users[userId]) {
      io.users[userId].forEach(function (client) {
        User.updateCoint(client);
      });
    }
  }
}

const pushCompleteSettlementToClient = (io, result, phien) => {
  const baccarat = io.baccarat;

  Object.values(baccarat.clients).forEach(function (client) {
    client.red({ baccarat: { finish: { result: result, round: phien, winClients: baccarat.winClients } } });
  });

  Object.values(io.admins).forEach(function (admin) {
    admin.forEach(function (client) {
      client.red({ baccarat: { finish: { result: result, round: phien } } });
    });
  });
}

const calculateWinLoss = (bet, result) => {
  let totalBet = bet.player + bet.banker + bet.tie + bet.big + bet.small;
  let winAmount = 0;
  let totalWin = 0;
  let totalLoss = 0;
  let boxes = { main: false, sub: false };
  let win = 0;

  if (bet.player > 0) {
    boxes.main = true;
    if (result.player) {
      win = bet.player * constants.playerOdds;
      totalwin += win;
      winAmount += (win - bet.player);
    }
    else {
      totalLoss += bet.player;
    }
  }
  if (bet.banker > 0) {
    boxes.main = true;
    if (result.banker) {
      win = bet.banker * constants.bankerOdds;
      totalwin += win;
      winAmount += (win - bet.banker);
    }
    else {
      totalLoss += bet.banker;
    }
  }
  if (bet.tie > 0) {
    boxes.main = false;
    if (result.tie) {
      win = bet.tie * constants.tieOdds;
      totalwin += win;
      winAmount += (win - bet.tie);
    }
    else {
      totalLoss += bet.tie;
    }
  }
  if (bet.big > 0) {
    boxes.main = false;
    if (result.big) {
      win = bet.big * constants.bigOdds;
      totalwin += win;
      winAmount += (win - bet.big);
    }
    else {
      totalLoss += bet.big;
    }
  }
  if (bet.small > 0) {
    boxes.main = false;
    if (result.small) {
      win = bet.small * constants.smallOdds;
      totalwin += win;
      winAmount += (win - bet.small);
    }
    else {
      totalLoss += bet.small;
    }
  }
  totalWin = parseFloat(totalWin.toFixed(2));
  winAmount = parseFloat(winAmount.toFixed(2));
  return { totalWin, winAmount, totalLoss, totalBet };
}


const settle = (io, result) => {
  const baccarat = io.baccarat;
  const phien = io.baccarat.phien - 1;

  BaccaratCuoc.find({ phien: phien }, (err, bets) => {
    if (err) {
      logger.logError(err);
      return;
    }

    if (bets && bets.length) {
      Promise.all(bets.map(function (bet) {

        const { totalWin, winAmount, totalLoss, totalBet } = calculateWinLoss(bet, result);

        bet.thanhtoan = true;
        bet.betwin = totalWin;
        bet.save();

        const { update, updateGame } = createUpdateData(totalWin, winAmount, totalLoss, totalBet);
        const gameInfo = {
          gameId: gameIds.baccarat,
          gameRoundId: phien,
          memberId: bet.memberId,
          siteId: bet.siteId
        }

        return new Promise((resolve) => {

          balanceApi.endGame(bet.uid, gameInfo, update, io.users, () => {
            BaccaratUser.updateOne({ uid: bet.uid }, { $inc: updateGame }, (err) => {
              if (err) {
                logger.logError(err);
              }

              resolve({ users: bet.name, bet: winAmount, red: bet.red });
            });
          });

          pushSettleResultToClients(totalWin, baccarat, bet, totalLoss, io);
        });
      })).then(results => {
        pushCompleteSettlementToClient(io, result, phien);

        play(io);
      }).catch(error => logger.logError(error));
    } else {
      pushCompleteSettlementToClient(io, result, phien);

      play(io);
    }
  });
}

const onGameRoundEnd = (io, gameLoop) => {
  if (io.baccarat.time < 0) {
    clearInterval(gameLoop);
    io.baccarat.time = 0;

    try {
      const cards = getCards();
      const baccaratGame = new BaccaratGame(cards);
      let action = "";

      do {
        action = baccaratGame.getAction();
        baccaratGame[action]();
      } while (action !== BaccaratGame.Actions.finalComparison);

      BaccaratPhien
        .create({ player: baccaratGame.player, banker: baccaratGame.banker })
        .then(record => {
          try {
            if (!!record) {
              io.baccarat.phien = record.id + 1;

              const result = baccaratGame.finalComparison();
              settle(io, result);
            }
          }
          catch (ex) {
            logger.logError(ex);
          }
        })
        .catch(error => logger.logError(error));
    }
    catch (error) {
      logger.logError(error);
    }
  }
};

const play = io => {
  io.baccarat.time = constants.startCountDownTime;

  let gameLoop = setInterval(() => {
    try {
      if (!io.baccarat.disabled) {
        io.baccarat.time--;
      }

      onBetTime(io);
      onBetTimeEnd(io);
      onGameRoundEnd(io, gameLoop);
    }
    catch (error) {
      logger.logError(error);
    }
  }, 1000);

  return gameLoop;
};

module.exports = play;

