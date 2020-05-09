const GameIds = require("./../../../config/appConfigs").gameIds;
const KenoProMaxPhien = require("./../../Models/KenoProMax/KenoProMax_phien");
const KenoProMaxCuoc = require("./../../Models/KenoProMax/KenoProMax_cuoc");
const KenoProMaxTempCuoc = require("./../../Models/KenoProMax/KenoProMax_tmpcuoc");
const KenoProMaxUser = require("./../../Models/KenoProMax/KenoProMax_user");

const BalanceApi = require("./../../apis/balanceApi");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const GameConfigs = require("./../../Models/GameConfig/GameConfigs");
const Logger = require("./../../web/logger");
const Bot = require("./bot");

const Constants = require("./constants");
const generateResult = require("./shuffleNumbers");

const settlementRuleEntries = Object.entries({
  big: (totalPoints, amount) =>
    totalPoints >= 811 ? amount * Constants.odds.big : 0,
  small: (totalPoints, amount) =>
    totalPoints <= 810 ? amount * Constants.odds.small : 0,
  odd: (totalPoints, amount) =>
    totalPoints % 2 === 1 ? amount * Constants.odds.odd : 0,
  even: (totalPoints, amount) =>
    totalPoints % 2 === 0 ? amount * Constants.odds.even : 0,
  gold: (totalPoints, amount) =>
    210 <= totalPoints && totalPoints <= 695 ? amount * Constants.odds.gold : 0,
  wood: (totalPoints, amount) =>
    696 <= totalPoints && totalPoints <= 763 ? amount * Constants.odds.wood : 0,
  water: (totalPoints, amount) =>
    764 <= totalPoints && totalPoints <= 855 ? amount * Constants.odds.water : 0,
  fire: (totalPoints, amount) =>
    856 <= totalPoints && totalPoints <= 923 ? amount * Constants.odds.fire : 0,
  earth: (totalPoints, amount) =>
    924 <= totalPoints && totalPoints <= 1410 ? amount * Constants.odds.earth : 0,
});

const runGame = (inIO) => {
  const loopInterval = 1000;
  const io = inIO;
  let kenoProMaxData = io.kenoProMax || {};

  kenoProMaxData.disabled = false;
  kenoProMaxData.remainingTime = Constants.roundDuration;

  let gameLoop = setInterval(() => {
    proceed(io, kenoProMaxData, gameLoop).catch((error) =>
      Logger.logError(error)
    );
  }, loopInterval);

  return gameLoop;
};

const proceed = async (io, kenoProMaxData, gameLoop) => {
  if (kenoProMaxData.remainingTime === Constants.roundDuration) {
    await checkGameStatus(io);
  }

  if (!kenoProMaxData.disabled) {
    kenoProMaxData.remainingTime--;
  }

  if (kenoProMaxData.remainingTime === Constants.placingBetDuration) {
    resetForNewRound(kenoProMaxData);
    await Bot.reset();
  }

  if (kenoProMaxData.remainingTime < 1) {
    kenoProMaxData.remainingTime = 1;

    clearInterval(gameLoop);
    await settleRound(io);
  } else if (kenoProMaxData.remainingTime < Constants.placingBetDuration) {
    var bots = await Bot.run(
      kenoProMaxData.remainingTime,
      kenoProMaxData.roundId,
      kenoProMaxData.realPlayers,
      kenoProMaxData.players,
      kenoProMaxData.totalBets
    );

    bots.in.forEach((bot) => {
      if (!kenoProMaxData.players[bot.id]) {
        Object.values(kenoProMaxData.realPlayers).forEach((user) => {
          user.red({
            kenoProMax: {
              ingame: {
                player: {
                  id: bot.id,
                  name: bot.name,
                  red: bot.red,
                  avatarId: bot.avatarId,
                  type: bot.type,
                },
              },
            },
          });
        });
      }

      kenoProMaxData.players[bot.id] = bot;
    });

    bots.out.forEach((bot) => {
      if (!!bot) {
        delete kenoProMaxData.players[bot.id];

        Object.values(kenoProMaxData.realPlayers).forEach(function (user) {
          user.red({ kenoProMax: { outgame: { playerId: bot.id } } });
        });
      }
    });

    pushRunningRoundInfoToAllRealPlayers(io);
  }
};

const checkGameStatus = async (io) => {
  const kenoProMaxData = io.kenoProMax || {};
  const config = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProMax }).exec();

  ConfigHelper.updateConfig(ConfigHelper.GameTypes.KenoProMax, config);
  kenoProMaxData.disabled = config === null || !config.enabled;

  if (kenoProMaxData.disabled) {
    let disabledMessage = config === null ? "" : config.disabled_message;

    kenoProMaxData.remainingTime = Constants.roundDuration;
    io.sendAllUser({ kenoProMax: { um: true, um_message: disabledMessage } });

    await GameConfigs.updateOne(
      { name: ConfigHelper.GameTypes.KenoProMax },
      { disabledround: kenoProMaxData.roundId }
    );
  }
};

const resetForNewRound = (kenoProMaxData) => {
  kenoProMaxData.ingame = {};
  kenoProMaxData.totalBets = { ...Constants.resetTotalBets };
  kenoProMaxData.chips = [];
  kenoProMaxData.winningPlayers = {};
};

const settleRound = async (io) => {
  const kenoProMaxData = io.kenoProMax || {};
  const result = generateResult();
  const newRound = await KenoProMaxPhien.create({
    result: result,
    time: new Date(),
  });

  if (!!newRound) {
    const finish = {
      result,
      roundId: newRound.id,
      time: newRound.time,
    };

    kenoProMaxData.roundId = finish.roundId + 1;

    await settleBets(io, finish);
  }
};

const settleBets = async (io, finish) => {
  const totalPoints = finish.result.reduce((total, number) => total + number, 0);
  const realPlayersBets = await KenoProMaxCuoc.find({ phien: finish.roundId }).exec();
  const botsBets = await KenoProMaxTempCuoc.find({ phien: finish.roundId }).exec();
  const allPlayersBets = realPlayersBets.concat(botsBets);

  if (allPlayersBets && allPlayersBets.length > 0) {
    await Promise.all(
      allPlayersBets.map(async (bet) => {
        const betResult = calculateBetResult(totalPoints, bet);

        bet.betwin = betResult.totalWin;
        bet.thanhtoan = true;

        await bet.save();
        notifyBetResult(io, bet, betResult);
        callEndGame(bet, finish, betResult, io.user);
      })
    );
  }

  pushRoundResultToAllRealPlayers(io, finish);
  runGame(io);
};

const calculateBetResult = (totalPoints, bet) => {
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

const callEndGame = (bet, finish, betResult, users) => {
  const gameInfo = {
    gameId: GameIds.kenopromax,
    gameRoundId: finish.roundId,
    memberId: bet.memberId,
    siteId: bet.siteId,
    time: finish.time,
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

  BalanceApi.endGame(bet.uid, gameInfo, settlementInfo, users, () => {
    KenoProMaxUser.updateOne({ uid: bet.uid }, { $inc: userUpdate }).catch(
      (error) => {
        Logger.logError(error);
      }
    );
  });
};

const pushRunningRoundInfoToAllRealPlayers = (io) => {
  const kenoProMaxData = io.kenoProMax || {};
  const adminData = {
    kenoProMax: {
      totalBets: kenoProMaxData.totalBets,
      ingame: kenoProMaxData.ingame,
    },
  };

  Object.values(kenoProMaxData.realPlayers).forEach((realPlayer) => {
    realPlayer.red({ kenoProMax: { totalBets: kenoProMaxData.totalBets } });
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewKenoProMax) {
        client.red(adminData);
      }
    });
  });
};

const pushRoundResultToAllRealPlayers = (io, finish) => {
  const kenoProMaxData = io.kenoProMax || {};

  Object.values(kenoProMaxData.realPlayers).forEach((realPlayer) => {
    realPlayer.red({
      kenoProMax: {
        finish: {
          roundId: finish.roundId,
          result: finish.result,
          winningPlayers: kenoProMaxData.winningPlayers,
        },
      },
    });
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      client.red({ kenoProMax: { finish } });
    });
  });
};

const notifyBetResult = (io, bet, betResult) => {
  let kenoProMaxData = io.kenoProMax || {};
  let status;

  if (betResult.totalWin > 0) {
    status = { win: true, bet: betResult.totalWin };
    kenoProMaxData.winningPlayers[bet.uid] = status;
  } else {
    status = { win: true, bet: betResult.totalLost };
  }

  if (kenoProMaxData.realPlayers[bet.uid]) {
    kenoProMaxData.realPlayers[bet.uid].red({ kenoProMax: { status: status } });
  } else if (io.users[bet.uid]) {
    // Need to review.
    io.users[bet.uid].forEach((realPlayer) => {
      BalanceApi.getBalance({ id: realPlayer.UID }, realPlayer, (balance) => {
        if (!!balance) {
          realPlayer.red({
            user: { red: balance.red, currency: balance.currency },
          });
        }
      });
    });
  }
};

module.exports = runGame;
