const BalanceApi = require("../../../../../../apis/balanceApi");
const ConfigHelper = require("../../../../../../Helpers/ConfigHelper");
const GameConfigs = require("../../../../../../Models/GameConfig/GameConfigs");
const Logger = require("../../../../../../web/logger");

const Constants = require("../constants");

const runGame = (io, definition) => {
  const loopInterval = 1000;
  const gameData = io[definition.name];

  gameData.disabled = false;
  gameData.remainingTime = definition.durations.wholeRound;

  const gameLoop = setInterval(() => {
    proceed(io, definition, gameLoop).catch(Logger.logError);
  }, loopInterval);

  return gameLoop;
};

const proceed = async (io, definition, gameLoop) => {
  const gameData = io[definition.name];

  if (gameData.remainingTime === definition.durations.wholeRound) {
    await checkGameStatus(io, definition);
  }

  if (!gameData.disabled) {
    gameData.remainingTime--;
  }

  if (gameData.remainingTime === definition.durations.placingBets) {
    resetForNewRound(gameData);
  }

  if (gameData.remainingTime < 0) {
    gameData.remainingTime = 0;

    clearInterval(gameLoop);
    await settleRound(io, definition);
  } else if (gameData.remainingTime < definition.durations.placingBets) {
    pushRunningRoundInfoToAllRealPlayers(io, definition);
  }
};

const checkGameStatus = async (io, definition) => {
  const gameName = definition.name;
  const gameConfigName = definition.configName;
  const gameData = io[gameName];
  const gameConfigs = await GameConfigs.findOne({ name: gameConfigName }).lean().exec();
  const previouslyDisabled = gameData.disabled;

  ConfigHelper.updateConfig(gameConfigName, gameConfigs);
  gameData.disabled = gameConfigs === null || !gameConfigs.enabled;

  if (gameData.disabled) {
    const disabledMessage = gameConfigs === null ? "" : gameConfigs.disabled_message;

    gameData.remainingTime = Constants.roundDuration;
    io.sendAllUser({ [gameName]: { um: true, um_message: disabledMessage } });

    await GameConfigs.updateOne({ name: gameConfigName }, { disabledround: gameData.roundId });
  } else if (previouslyDisabled) {
    io.sendAllUser({
      [gameName]: {
        remainingTime: gameData.remainingTime,
        gameConfigs: {
          minbet: gameConfigs.minbet,
          maxbet: gameConfigs.maxbet,
          choices_maxbet: gameConfigs.choices_maxbet,
          odds: gameConfigs.odds,
        },
      },
    });
  } else {
    io.sendAllUser({ [gameName]: { remainingTime: gameData.remainingTime } });
  }
};

const resetForNewRound = (gameData) => {
  gameData.ingame = {};
  gameData.totalBets = { ...Constants.resetTotalBets };
};

const settleRound = async (io, definition) => {
  const gameData = io[definition.name];
  const resultFromAdmin = gameData.settlementResultFromAdmin;
  const result = gameData.roundId === resultFromAdmin.roundId ? resultFromAdmin.result : definition.generateResult();
  const totalPoints = result.reduce((total, number) => total + number, 0);
  const settlementResult = definition.settlementRules.reduce((result, [choice, rule]) => {
    result[choice] = rule(totalPoints);

    return result;
  }, {});
  const newRound = await definition.roundRepository.create({
    ...result,
    settlementResult,
    time: new Date(),
  });

  if (newRound) {
    const finish = {
      settlementResult,
      result,
      roundId: newRound.id,
      time: newRound.time,
    };

    gameData.roundId = finish.roundId + 1;

    await settleBets(io, definition, finish);
  }
};

const settleBets = async (io, definition, finish) => {
  const bets = await definition.betRepository.find({ phien: finish.roundId }).exec();

  if (bets && bets.length > 0) {
    const gameConfigs = await GameConfigs.findOne({ name: definition.configName }).lean().exec();

    await Promise.all(
      bets.map(async (bet) => {
        const betResult = calculateBetResult(finish, bet, gameConfigs.odds);

        bet.betwin = betResult.totalWin;
        bet.thanhtoan = true;

        await bet.save();
        notifyBetResult(io, definition, bet, betResult);
        callEndGame(definition, bet, finish, betResult, io.users);
      })
    );
  }

  pushRoundResultToAllRealPlayers(io, definition, finish);
  runGame(io, definition);
};

const calculateBetResult = (finish, bet, odds) => {
  const betResult = Object.entries(finish.settlementResult).reduce(
    (result, [choice, win]) => {
      const betAmount = bet[choice];
      const winAmount = win ? betAmount * odds[choice] : 0;

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

const callEndGame = (definition, bet, finish, betResult, users) => {
  const gameInfo = {
    gameId: definition.id,
    gameRoundId: finish.roundId,
    memberId: bet.memberId,
    siteId: bet.siteId,
    time: finish.time,
  };
  const settlementInfo = {
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

const pushRunningRoundInfoToAllRealPlayers = (io, definition) => {
  const gameName = definition.name;
  const gameData = io[gameName];
  const viewName = definition.viewName;
  const adminData = {
    [gameName]: {
      totalBets: gameData.totalBets,
      ingame: gameData.ingame,
    },
  };

  Object.values(io.users).forEach((players) => {
    players.forEach((player) => {
      if (player.gameEvent && player.gameEvent[viewName]) {
        player.red({ [gameName]: { totalBets: gameData.totalBets } });
      }
    });
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      if (client.gameEvent && client.gameEvent[viewName]) {
        client.red(adminData);
      }
    });
  });
};

const pushRoundResultToAllRealPlayers = (io, definition, finish) => {
  const gameName = definition.name;

  io.sendAllUser({
    [gameName]: {
      finish: {
        roundId: finish.roundId,
        result: finish.result,
        settlementResult: finish.settlementResult,
      },
    },
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      client.red({ [gameName]: { finish } });
    });
  });
};

const notifyBetResult = (io, definition, bet, betResult) => {
  if (!io.users[bet.uid]) {
    return;
  }

  const gameName = definition.name;
  const status = { winningByChoices: betResult.winningByChoices };

  if (betResult.totalWin > 0) {
    status.win = true;
    status.bet = betResult.totalWin;
  } else {
    status.win = false;
    status.bet = betResult.totalLost;
  }

  io.users[bet.uid].forEach((user) => {
    user.red({ [gameName]: { status: status } });
  });
};

module.exports = runGame;
