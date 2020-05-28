const { constants, boxes } = require("./constant");
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
const gameIds = require('../../../config/appConfigs').gameIds;
const balanceApi = require('./../../apis/balanceApi');

const getCards = () => {
  let cards = [...baseCard.card];

  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);

  return cards;
};

const onBetTimeEnd = io => {
  io.game.baccarat.totalBets = { player: 0, banker: 0, big: 0, small: 0, tie: 0, playerPair: 0, bankerPair: 0 };
  io.game.baccarat.totalBetsAdmin = { player: 0, banker: 0, big: 0, small: 0, tie: 0, playerPair: 0, bankerPair: 0 };
  io.game.baccarat.ingame = {};
  io.game.baccarat.winClients = {};
};

const onBetTime = io => {
  try {
    const baccarat = io.game.baccarat;

    if (baccarat && baccarat.remainingTime == constants.getGameConfigTime) {
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

          GameConfigs.updateOne({ name: ConfigHelper.GameTypes.Baccarat }, { disabledround: baccarat.roundId }, function (err, data) {
            if (err) logger.logError(err);
          });

          //reset time
          baccarat.remainingTime = constants.getGameConfigTime;
        }
      });
    }

    if (baccarat && baccarat.remainingTime < constants.betTime && baccarat.remainingTime >= 0) {

      Object.values(baccarat.clients).forEach((client) => {
        client.red({ baccarat: { totalBets: baccarat.totalBets, roundId: baccarat.roundId } });
      });

      if (io.admins) {
        let adminData = { baccarat: { info: baccarat.totalBetsAdmin, ingame: baccarat.ingame } };

        Object.values(io.admins).forEach(function (admin) {
          admin.forEach(function (client) {
            if (client.gameEvent && client.gameEvent.viewBaccarat) {
              client.red(adminData);
            }
          });
        });
      }
    }

    if (!baccarat.disabled) {
      baccarat.remainingTime--;
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

const pushSettleResultToClient = (totalWin, baccarat, bet, totalLoss, io, winningByChoices) => {
  let status = {};
  const userId = bet.uid;

  if (totalWin > 0) {
    status = { win: true, bet: totalWin };
    status.winningByChoices = winningByChoices;
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

const pushCompleteSettlementToClients = (io, settlementResult, finalCards, roundId) => {
  const baccarat = io.game.baccarat;

  Object.values(baccarat.clients).forEach(function (client) {
    client.red({ baccarat: { finish: { result: finalCards, settlementResult, round: roundId, winningPlayers: baccarat.winClients } } });
  });

  Object.values(io.admins).forEach(function (admin) {
    admin.forEach(function (client) {
      client.red({ baccarat: { finish: { result: finalCards, settlementResult, round: roundId } } });
    });
  });

  onBetTimeEnd(io);
}

const calculateWinLoss = (bet, result) => {
  const totalBet = boxes.reduce((total, box) => total + bet[box], 0);
  let winAmount = 0;
  let totalWin = 0;
  let totalLoss = 0;
  let win = 0;
  const boxesResult = boxes.reduce((res, box) => {
    res[box] = result[box] && bet[box] > 0;

    return res;
  }, {});

  if (bet.player > 0) {
    if (result.player) {
      win = bet.player * constants.playerOdds;
      totalWin += win;
      winAmount += (win - bet.player);
    }
    else {
      totalLoss += bet.player;
    }
  }

  if (bet.banker > 0) {
    if (result.banker) {
      win = bet.banker * constants.bankerOdds;
      totalWin += win;
      winAmount += (win - bet.banker);
    }
    else {
      totalLoss += bet.banker;
    }
  }

  if (bet.tie > 0) {
    if (result.tie) {
      win = bet.tie * constants.tieOdds;
      totalWin += win;
      winAmount += (win - bet.tie);
    }
    else {
      totalLoss += bet.tie;
    }
  }

  if (bet.big > 0) {
    if (result.big) {
      win = bet.big * constants.bigOdds;
      totalWin += win;
      winAmount += (win - bet.big);
    }
    else {
      totalLoss += bet.big;
    }
  }

  if (bet.small > 0) {
    if (result.small) {
      win = bet.small * constants.smallOdds;
      totalWin += win;
      winAmount += (win - bet.small);
    }
    else {
      totalLoss += bet.small;
    }
  }

  if (bet.playerPair > 0) {
    if (result.playerPair) {
      win = bet.playerPair * constants.playerPairOdds;
      totalWin += win;
      winAmount += (win - bet.playerPair);
    }
    else {
      totalLoss += bet.playerPair;
    }
  }

  if (bet.bankerPair > 0) {
    if (result.bankerPair) {
      win = bet.bankerPair * constants.bankerPairOdds;
      totalWin += win;
      winAmount += (win - bet.bankerPair);
    }
    else {
      totalLoss += bet.bankerPair;
    }
  }

  totalWin = parseFloat(totalWin.toFixed(2));
  winAmount = parseFloat(winAmount.toFixed(2));

  return { totalWin, winAmount, totalLoss, totalBet, winningByChoices: boxesResult };
}

const settle = (io, result, settlementResult, finalCards) => {
  const baccarat = io.game.baccarat;
  const roundId = io.game.baccarat.roundId - 1;

  BaccaratCuoc.find({ phien: roundId }, (err, bets) => {
    if (err) {
      logger.logError(err);
      return;
    }

    if (bets && bets.length) {
      Promise.all(bets.map(function (bet) {

        const { totalWin, winAmount, totalLoss, totalBet, winningByChoices } = calculateWinLoss(bet, result);

        bet.thanhtoan = true;
        bet.betwin = totalWin;
        bet.save();

        const { update, updateGame } = createUpdateData(totalWin, winAmount, totalLoss, totalBet);
        const gameInfo = {
          gameId: gameIds.baccarat,
          gameRoundId: roundId,
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

          pushSettleResultToClient(totalWin, baccarat, bet, totalLoss, io, winningByChoices);
        });
      })).then(results => {
        pushCompleteSettlementToClients(io, settlementResult, finalCards, roundId);

        play(io);
      }).catch(error => logger.logError(error));
    } else {
      pushCompleteSettlementToClients(io, settlementResult, finalCards, roundId);

      play(io);
    }
  });
}

const onGameRoundEnd = (io, gameLoop) => {
  if (io.game.baccarat.remainingTime < 0) {
    clearInterval(gameLoop);
    io.game.baccarat.remainingTime = 0;

    try {
      const cards = getCards();
      const baccaratGame = new BaccaratGame(cards);
      let action = "";

      do {
        action = baccaratGame.getAction();
        baccaratGame[action]();
      } while (action !== BaccaratGame.Actions.finalComparison);

      const result = baccaratGame.finalComparison();

      BaccaratPhien
        .create({ player: baccaratGame.player, banker: baccaratGame.banker, result })
        .then(record => {
          try {
            if (!!record) {
              io.game.baccarat.roundId = record.id + 1;

              const finalCards = baccaratGame.getFinalCards();
              settle(io, { ...result, ...finalCards }, result, finalCards);
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
  io.game.baccarat.remainingTime = constants.startCountDownTime;

  let gameLoop = setInterval(() => {
    try {
      onBetTime(io);
      onGameRoundEnd(io, gameLoop);
    }
    catch (error) {
      logger.logError(error);
    }
  }, 1000);

  return gameLoop;
};

module.exports = play;

