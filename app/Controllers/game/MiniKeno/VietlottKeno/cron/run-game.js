const GameIds = require("./../../../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../../../apis/balanceApi");
const ConfigHelper = require("./../../../../../Helpers/ConfigHelper");
const GameConfigs = require("./../../../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../../../web/logger");

const KenoProVietPhien = require("./../models/KenoProViet_phien");
const KenoProVietOne = require("./../models/KenoProViet_one");

const Constants = require("./../constants");

const runGame = (inIO) => {
  const loopInterval = 1000;
  const io = inIO;
  const kenoProVietData = io.kenoProViet || {};

  kenoProVietData.disabled = false;
  kenoProVietData.remainingTime = Constants.durations.wholeRound;

  const gameLoop = setInterval(() => {
    proceed(io, kenoProVietData, gameLoop).catch(Logger.logError);
  }, loopInterval);

  return gameLoop;
};

const proceed = async (io, kenoProVietData, gameLoop) => {
  if (kenoProVietData.remainingTime === Constants.durations.wholeRound) {
    await checkGameStatus(io);
  }

  if (!kenoProVietData.disabled) {
    kenoProVietData.remainingTime--;
  }

  if (kenoProVietData.remainingTime === Constants.durations.placingBets) {
    resetForNewRound(kenoProVietData);
  }

  if (kenoProVietData.remainingTime < 0 && kenoProVietData.finished) {
    kenoProVietData.remainingTime = 0;

    clearInterval(gameLoop);
    
  } else if (kenoProVietData.remainingTime < Constants.durations.placingBets) {
    pushRunningRoundInfoToAllRealPlayers(io);
  }
};

const checkGameStatus = async (io) => {
  const kenoProVietData = io.kenoProViet || {};
  const config = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProViet }).lean().exec()

  ConfigHelper.updateConfig(ConfigHelper.GameTypes.KenoProViet, config);
  kenoProVietData.disabled = config === null || !config.enabled;

  if (kenoProVietData.disabled) {
    const disabledMessage = config === null ? "" : config.disabled_message;

    kenoProVietData.remainingTime = Constants.durations.wholeRound;
    io.sendAllUser({ kenoProViet: { um: true, um_message: disabledMessage } });

    await GameConfigs.updateOne({ name: ConfigHelper.GameTypes.KenoProViet }, { disabledround: kenoProVietData.roundId });

    return;
  }

  io.sendAllUser({ kenoProViet: { remainingTime: kenoProVietData.remainingTime } });
};

const resetForNewRound = (kenoProVietData) => {
  kenoProVietData.ingame = {};
  kenoProVietData.totalBets = { ...Constants.resetTotalBets };

   //reset data received from Admin2
  kenoProVietData.finished = false;
  kenoProVietData.result = {};
  kenoProVietData.settlementResult = {};
};

const settleRound = async (io, result) => {
  const kenoProVietData = io.kenoProViet || {};

  // const settlementResult = settlementRuleEntries.reduce((result, [choice, rule]) => {
  //   result[choice] = rule(totalReds);

  //   return result;
  // }, {});

  //TODO it will returns from admin2

  const newRound = await KenoProVietPhien.create({
    ...result,
    settlementResult,
    time: new Date(),
  });

  if (!!newRound) {
    const finish = {
      settlementResult,
      result,
      roundId: newRound.id,
      time: newRound.time,
    };

    kenoProVietData.roundId = finish.roundId + 1;

    await settleBets(io, finish);
  }
};

const settleBets = async (io, finish) => {
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProViet);
  const bets = await KenoProVietOne.find({ phien: finish.roundId }).exec();

  if (bets && bets.length > 0) {
    await Promise.all(
      bets.map(async (bet) => {
        const betResult = calculateBetResult(finish, bet, configs);

        bet.betwin = betResult.totalWin;
        bet.thanhtoan = true;

        await bet.save();
        notifyBetResult(io, bet, betResult);
        callEndGame(bet, finish, betResult, io.users);
      })
    );
  }

  pushRoundResultToAllRealPlayers(io, finish);
  runGame(io);
};

const calculateBetResult = (finish, bet, configs) => {
  const betResult = Object.entries(finish.settlementResult).reduce(
    (result, [choice, win]) => {
      const betAmount = bet[choice];
      const winAmount = win ? betAmount * configs.odds[choice] : 0;

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
    gameId: GameIds.kenoproviet,
    gameRoundId: finish.roundId,
    memberId: bet.memberId,
    siteId: bet.siteId,
    time: finish.time,
  };
  let settlementInfo = {
    redPlay: betResult.totalBetAmount,
  };

  if (betResult.totalWin > 0) {
    settlementInfo.red = betResult.totalWin;
  }

  if (betResult.netWin > 0) {
    settlementInfo.redWin = betResult.netWin;
  }

  if (betResult.totalLost > 0) {
    settlementInfo.redLost = betResult.totalLost;
  }

  BalanceApi.endGame(bet.uid, gameInfo, settlementInfo, users);
};

const pushRunningRoundInfoToAllRealPlayers = (io) => {
  const kenoProVietData = io.kenoProViet || {};
  const adminData = {
    kenoProViet: {
      totalBets: kenoProVietData.totalBets,
      ingame: kenoProVietData.ingame,
    },
  };

  Object.values(io.users).forEach((clients) => {
    clients.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewkenoProViet) {
        client.red({ kenoProViet: { totalBets: kenoProVietData.totalBets } });
      }
    });
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewkenoProViet) {
        client.red(adminData);
      }
    });
  });
};

const pushRoundResultToAllRealPlayers = (io, finish) => {
  io.sendAllUser({
    kenoProViet: {
      finish: {
        roundId: finish.roundId,
        result: finish.result,
        settlementResult: finish.settlementResult,
      },
    },
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      client.red({ kenoProViet: { finish } });
    });
  });
};

const notifyBetResult = (io, bet, betResult) => {
  let status = { winningByChoices: betResult.winningByChoices };

  if (betResult.totalWin > 0) {
    status.win = true;
    status.bet = betResult.totalWin;
  } else {
    status.win = false;
    status.bet = betResult.totalLost;
  }

  if (io.users[bet.uid]) {
    io.users[bet.uid].forEach((user) => {
      user.red({ kenoProViet: { status: status } });
    });
  }
};

module.exports = runGame;
