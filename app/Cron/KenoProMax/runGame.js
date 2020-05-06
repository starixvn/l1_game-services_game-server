const Chance = require("chance");

const GameIds = require("./../../../config/appConfigs").gameIds;
const KenoProMaxPhien = require("./../../Models/KenoProMax/KenoProMax_phien");
const KenoProMaxCuoc = require("./../../Models/KenoProMax/KenoProMax_cuoc");
const KenoProMaxUser = require("./../../Models/KenoProMax/KenoProMax_user");

const BalanceApi = require("./../../apis/balanceApi");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const GameConfigs = require("./../../Models/GameConfig/GameConfigs");
const Logger = require("./../../web/logger");

const Constants = require("./constants");

const seeds = [...Array(81).keys()].slice(1);
const settlementRuleEntries = Object.entries({
  big: (totalPoints, amount) =>
    totalPoints >= 811 ? amount * Constants.payoutRatio.big : 0,
  small: (totalPoints, amount) =>
    totalPoints <= 810 ? amount * Constants.payoutRatio.small : 0,
  odd: (totalPoints, amount) =>
    totalPoints % 2 === 1 ? amount * Constants.payoutRatio.odd : 0,
  even: (totalPoints, amount) =>
    totalPoints % 2 === 0 ? amount * Constants.payoutRatio.even : 0,
  metal: (totalPoints, amount) =>
    210 <= totalPoints && totalPoints <= 695
      ? amount * Constants.payoutRatio.metal
      : 0,
  wood: (totalPoints, amount) =>
    696 <= totalPoints && totalPoints <= 763
      ? amount * Constants.payoutRatio.wood
      : 0,
  water: (totalPoints, amount) =>
    764 <= totalPoints && totalPoints <= 855
      ? amount * Constants.payoutRatio.water
      : 0,
  fire: (totalPoints, amount) =>
    856 <= totalPoints && totalPoints <= 923
      ? amount * Constants.payoutRatio.fire
      : 0,
  earth: (totalPoints, amount) =>
    924 <= totalPoints && totalPoints <= 1410
      ? amount * Constants.payoutRatio.earth
      : 0,
});

let runGame = (inIO) => {
  const loopInterval = 1000;

  let io = inIO;
  let kenoProMaxData = io.kenoProMax || {};

  kenoProMaxData.disabled = false;
  kenoProMaxData.timer = Constants.roundDuration;

  let gameLoop = setInterval(() => {
    if (kenoProMaxData.timer === Constants.roundDuration) {
      runAtStartingRound(io);
    }

    if (!kenoProMaxData.disabled) {
      kenoProMaxData.timer--;
    }

    if (kenoProMaxData.timer === Constants.placingBetDuration) {
      resetForNewRound(kenoProMaxData);
    }

    if (kenoProMaxData.timer < 0) {
      kenoProMaxData.timer = 0;

      clearInterval(gameLoop);
      settleRound(io);
    } else if (kenoProMaxData.timer < Constants.placingBetDuration) {
      pushRunningRoundInfoToAllClients(io);
    }
  }, loopInterval);

  return gameLoop;
};

let runAtStartingRound = (io) => {
  let kenoProMaxData = io.kenoProMax || {};

  GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProMax })
    .exec()
    .then(async (configs) => {
      ConfigHelper.updateConfig(ConfigHelper.GameTypes.KenoProMax, configs);
      kenoProMaxData.disabled = configs === null || !configs.enabled;

      if (kenoProMaxData.disabled) {
        let disabledMessage = configs === null ? "" : configs.disabled_message;

        kenoProMaxData.timer = Constants.roundDuration;
        io.sendAllUser({
          kenoProMax: { um: true, um_message: disabledMessage },
        });

        await GameConfigs.updateOne(
          { name: ConfigHelper.GameTypes.KenoProMax },
          { disabledround: kenoProMaxData.phien }
        );
      }
    })
    .catch((error) => Logger.logError(error));
};

let resetForNewRound = (kenoProMaxData) => {
  kenoProMaxData.ingame = {};
  kenoProMaxData.data = { ...Constants.resetData };
  kenoProMaxData.adminData = { ...Constants.resetData };
  kenoProMaxData.winClients = {};
  kenoProMaxData.players = {};
  kenoProMaxData.clients = {};
};

let settleRound = (io) => {
  let kenoProMaxData = io.kenoProMax || {};
  let result = generateResult();

  KenoProMaxPhien.create({ result: result, time: new Date() })
    .then((newRound) => {
      if (!!newRound) {
        let finish = { result: result, roundId: newRound.id };

        kenoProMaxData.phien = finish.roundId + 1;

        settleBets(io, finish);
      }
    })
    .catch((error) => Logger.logError(error));
};

let settleBets = (io, finish) => {
  let totalPoints = finish.result.reduce((total, number) => total + number, 0);

  KenoProMaxCuoc.find({ phien: finish.roundId })
    .exec()
    .then(async (bets) => {
      if (bets && bets.length > 0) {
        await Promise.all(
          bets.map(async (bet) => {
            let betResult = calculateBetResult(totalPoints, bet);

            bet.betwin = betResult.totalWin;
            bet.thanhtoan = true;

            await bet.save();

            let gameInfo = {
              gameId: GameIds.kenopromax,
              gameRoundId: finish.roundId,
              memberId: bet.memberId,
              siteId: bet.siteId,
            };
            let settlementInfo = {
              redPlay: betResult.totalBetAmount,
            };
            let userUpdate = {
              redPlay: betResult.totalBetAmount,
            };

            if (betResult.totalWin > 0) {
              settlementInfo.red = betResult.totalWin;
            }

            if (betResult.netWin > 0) {
              settlementInfo.redWin = betResult.netWin;
              userUpdate.red = betResult.netWin;
            }

            if (betResult.totalLost > 0) {
              settlementInfo.redLost = betResult.totalLost;
              settlementInfo.red_lost = betResult.totalLost;
            }

            BalanceApi.endGame(
              bet.uid,
              gameInfo,
              settlementInfo,
              io.users,
              () => {
                KenoProMaxUser.updateOne(
                  { uid: bet.uid },
                  { $inc: userUpdate }
                ).catch((error) => {
                  Logger.logError(error);
                });
              }
            );
            captureWinClient(io, bet, betResult);
          })
        );

        pushRoundResultToAllClients(io, finish);
        runGame(io);
      } else {
        pushRoundResultToAllClients(io, finish);
        runGame(io);
      }
    })
    .catch((error) => Logger.logError(error));
};

let generateResult = () => {
  const chance = new Chance();
  let result = chance.pickset(seeds, 20);

  result.sort((pre, next) => pre - next);

  return result;
};

let calculateBetResult = (totalPoints, bet) => {
  let betResult = settlementRuleEntries.reduce(
    (result, [choice, rule]) => {
      let betAmount = bet[choice];
      let winAmount = rule(totalPoints, betAmount);

      result.totalBetAmount += betAmount;
      result.totalWin += winAmount;

      if (winAmount > 0) {
        result.netWin += winAmount - betAmount;
      } else {
        result.totalLost += betAmount;
      }

      return result;
    },
    {
      totalBetAmount: 0,
      totalWin: 0,
      netWin: 0,
      totalLost: 0,
    }
  );

  betResult.totalWin = parseFloat(betResult.totalWin.toFixed(2));
  betResult.netWin = parseFloat(betResult.netWin.toFixed(2));

  return betResult;
};

let pushRunningRoundInfoToAllClients = (io) => {
  let kenoProMaxData = io.kenoProMax || {};

  Object.values(kenoProMaxData.clients).forEach((client) => {
    client.red({ kenoProMax: { client: kenoProMaxData.data } });
  });

  let adminData = {
    kenoProMax: {
      info: kenoProMaxData.dataAdmin,
      ingame: kenoProMaxData.ingame,
    },
  };

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewKenoProMax) {
        client.red(adminData);
      }
    });
  });
};

let pushRoundResultToAllClients = (io, finish) => {
  let kenoProMaxData = io.kenoProMax || {};

  Object.values(kenoProMaxData.clients).forEach((client) => {
    client.red({
      kenoProMax: {
        finish: {
          result: finish.result,
          roundId: finish.roundId,
          winClients: kenoProMaxData.winClients,
        },
      },
    });
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      client.red({ kenoProMax: { finish: finish } });
    });
  });
};

let captureWinClient = (io, bet, betResult) => {
  let kenoProMaxData = io.kenoProMax || {};
  let status;

  if (betResult.totalWin > 0) {
    status = { win: true, bet: betResult.totalWin };
    kenoProMaxData.winClients[bet.uid] = status;
  } else {
    status = { win: true, bet: betResult.totalLost };
  }

  if (kenoProMaxData.clients[bet.uid]) {
    kenoProMaxData.clients[bet.uid].red({ kenoProMax: { status: status } });
  } else if (io.users[bet.uid]) {
    io.users[bet.uid].forEach((client) => {
      BalanceApi.getBalance({ id: client.UID }, client, (balance) => {
        if (!!balance) {
          client.red({
            user: { red: balance.red, currency: balance.currency },
          });
        }
      });
    });
  }
};

module.exports = runGame;
