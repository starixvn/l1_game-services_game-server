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
  big: (totalPoints) => totalPoints >= 811,
  small: (totalPoints) => totalPoints <= 810,
  odd: (totalPoints) => totalPoints % 2 === 1,
  even: (totalPoints) => totalPoints % 2 === 0,
  gold: (totalPoints) => 210 <= totalPoints && totalPoints <= 695,
  wood: (totalPoints) => 696 <= totalPoints && totalPoints <= 763,
  water: (totalPoints) => 764 <= totalPoints && totalPoints <= 855,
  fire: (totalPoints) => 856 <= totalPoints && totalPoints <= 923,
  earth: (totalPoints) => 924 <= totalPoints && totalPoints <= 1410,
});

const runGame = (inIO) => {
  const loopInterval = 1000;
  const io = inIO;
  let kenoProMaxData = io.kenoProMax || {};

  kenoProMaxData.disabled = false;
  kenoProMaxData.remainingTime = Constants.roundDuration;

  let gameLoop = setInterval(() => {
    proceed(io, kenoProMaxData, gameLoop).catch((error) =>{
        Logger.logError(error);
        console.log(error);
      }     
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
    await Bot.run(kenoProMaxData);
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
  kenoProMaxData.chips = { ...Constants.resetChips };
  kenoProMaxData.winningPlayers = {};
};

const settleRound = async (io) => {
  const kenoProMaxData = io.kenoProMax || {};
  const result = generateResult();
  const totalPoints = result.reduce((total, number) => total + number, 0);
  let settlementResult = settlementRuleEntries.reduce((result, [choice, rule]) => {
    result[choice] = rule(totalPoints);

    return result;
  }, {});
  const newRound = await KenoProMaxPhien.create({
    settlementResult,
    result,
  });

  if (!!newRound) {
    const finish = {
      settlementResult,
      result,
      roundId: newRound.id,
      time: newRound.time,
    };

    kenoProMaxData.roundId = finish.roundId + 1;

    await settleBets(io, finish);
  }
};

const settleBets = async (io, finish) => {
  const realPlayersBets = await KenoProMaxCuoc.find({ phien: finish.roundId }).exec();
  const botsBets = await KenoProMaxTempCuoc.find({ phien: finish.roundId }).exec();
  const allPlayersBets = realPlayersBets.concat(botsBets);

  if (allPlayersBets && allPlayersBets.length > 0) {
    await Promise.all(
      allPlayersBets.map(async (bet) => {
        const betResult = calculateBetResult(finish, bet);

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

const calculateBetResult = (finish, bet) => {
  let betResult = Object.entries(finish.settlementResult).reduce(
    (result, [choice, win]) => {
      let betAmount = bet[choice];
      let winAmount = win ? betAmount * Constants.odds[choice] : 0;

      result.totalBetAmount += betAmount;
      result.totalWin += winAmount;
      result.winningByChoices[choice] = winAmount;

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
      winningByChoices: {},
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
          settlementResult: finish.settlementResult,
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
  let status = { winningByChoices: betResult.winningByChoices };

  if (betResult.totalWin > 0) {
    status.win = true;
    status.bet = betResult.totalWin;
    kenoProMaxData.winningPlayers[bet.uid] = status;
  } else {
    status.win = false;
    status.bet = betResult.totalLost;
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
  }else{    
    Bot.updateBalance(bet.uid, betResult.totalWin);
  }
};

module.exports = runGame;
