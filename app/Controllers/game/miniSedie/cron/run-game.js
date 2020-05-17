var cloneDeep = require("lodash.clonedeep");
const Constants = require("../constants");
const GameIds = require("../../../../../config/appConfigs").gameIds;
const MiniSediePhien = require("../models/MiniSedie_phien");
const MiniSedieCuoc = require("../models/MiniSedie_cuoc");
//const MiniSedieTempCuoc = require("../models/MiniSedie_tmpcuoc");
const MiniSedieUser = require("../models/MiniSedie_user");

const BalanceApi = require("../../../../apis/balanceApi");
const ConfigHelper = require("../../../../Helpers/ConfigHelper");
const GameConfigs = require("../../../../Models/GameConfig/GameConfigs");
const Logger = require("../../../../web/logger");
const Bot = require("./bot");

const settlementRuleEntries = Object.entries({
  odd: (totalReds) => totalReds % 2 === 1,
  even: (totalReds) => totalReds % 2 === 0,
  red3: (totalReds) => totalReds === 3,
  red4: (totalReds) => totalReds === 4,
  white3: (totalReds) => totalReds === 1,
  white4: (totalReds) => totalReds === 0,
});


const runGame = (inIO) => {
  const loopInterval = 1000;
  const io = inIO;
  let miniSedieData = io.miniSedie || {};

  miniSedieData.disabled = false;
  miniSedieData.remainingTime = Constants.roundDuration;

  let gameLoop = setInterval(() => {
    proceed(io, miniSedieData, gameLoop).catch(Logger.logError);
  }, loopInterval);

  return gameLoop;
};

const proceed = async (io, miniSedieData, gameLoop) => {
  if (miniSedieData.remainingTime === Constants.roundDuration) {
    await checkGameStatus(io);
  }

  if (!miniSedieData.disabled) {
    miniSedieData.remainingTime--;
  }

  if (miniSedieData.remainingTime === Constants.placingBetDuration) {
    resetForNewRound(miniSedieData);
    //await Bot.reset();
  }

  if (miniSedieData.remainingTime < 1) {
    miniSedieData.remainingTime = 1;

    clearInterval(gameLoop);
    await settleRound(io);
  } else if (miniSedieData.remainingTime < Constants.placingBetDuration) {
    //await Bot.run(miniSedieData);
    pushRunningRoundInfoToAllRealPlayers(io);
  }
};

const checkGameStatus = async (io) => {
  const miniSedieData = io.miniSedie || {};
  const config = await GameConfigs.findOne({
    name: ConfigHelper.GameTypes.MiniSedie,
  }).exec();

  ConfigHelper.updateConfig(ConfigHelper.GameTypes.MiniSedie, config);
  miniSedieData.disabled = config === null || !config.enabled;

  if (miniSedieData.disabled) {
    let disabledMessage = config === null ? "" : config.disabled_message;

    miniSedieData.remainingTime = Constants.roundDuration;
    io.sendAllUser({ miniSedie: { um: true, um_message: disabledMessage } });

    await GameConfigs.updateOne(
      { name: ConfigHelper.GameTypes.MiniSedie },
      { disabledround: miniSedieData.roundId }
    );
  }
};

const resetForNewRound = (miniSedieData) => {
  miniSedieData.ingame = {};
  miniSedieData.totalBets = { ...Constants.resetTotalBets };
};

const settleRound = async (io) => {
  const miniSedieData = io.miniSedie || {};
  const result = generateResult();
  let totalReds = Object.values(result).filter(function (value) { return value == true; }).length;
  let settlementResult = settlementRuleEntries.reduce(
    (result, [choice, rule]) => {
      result[choice] = rule(totalReds);

      return result;
    },
    {}
  );
  const newRound = await MiniSediePhien.create({
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

    miniSedieData.roundId = finish.roundId + 1;

    await settleBets(io, finish);
  }
};

const generateResult = () => {
  let red1 = ((Math.random() * 2) >> 0) != 0;
  let red2 =
    Math.floor(Math.random() * 6) +
    Math.floor(Math.random() * 6) +
    Math.floor(Math.random() * 6) +
    3 <=
    10;
  let red3 =
    (Math.floor(Math.random() * 6) +
      Math.floor(Math.random() * 6) +
      Math.floor(Math.random() * 6) +
      3) %
    2 ==
    0;
  let red4 = (Math.floor(Math.random() * 10000) + 1) % 2 != 0;

  return { red1, red2, red3, red4 };
};

const settleBets = async (io, finish) => {
  const realPlayersBets = await MiniSedieCuoc.find({
    phien: finish.roundId,
  }).exec();
  // const botsBets = await MiniSedieTempCuoc.find({
  //   phien: finish.roundId,
  // }).exec();
  //const allPlayersBets = realPlayersBets.concat(botsBets);
  const allPlayersBets = realPlayersBets

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
    gameId: GameIds.minisedie,
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
    userUpdate.redLost = betResult.totalLost;
  }

  BalanceApi.endGame(bet.uid, gameInfo, settlementInfo, users, () => {
    MiniSedieUser.updateOne({ uid: bet.uid }, { $inc: userUpdate }).catch(
      (error) => {
        Logger.logError(error);
      }
    );
  });
};

const pushRunningRoundInfoToAllRealPlayers = (io) => {
  const miniSedieData = io.miniSedie || {};
  const adminData = {
    miniSedie: {
      totalBets: miniSedieData.totalBets,
      ingame: miniSedieData.ingame,
    },
  };

  Object.values(io.users).forEach((clients) => {
    clients.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewMiniSedie) {
        client.red({ miniSedie: { totalBets: miniSedieData.totalBets } });
      }
    });
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewMiniSedie) {
        client.red(adminData);
      }
    });
  });
};

const pushRoundResultToAllRealPlayers = (io, finish) => {
  io.sendAllUser({
    miniSedie: {
      finish: {
        roundId: finish.roundId,
        result: finish.result,
        settlementResult: finish.settlementResult
      },
    },
  });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      client.red({ miniSedie: { finish } });
    });
  });
};

const notifyBetResult = (io, bet, betResult) => {
  let miniSedieData = io.miniSedie || {};
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
      user.red({ miniSedie: { status: status } });
    });
  } else {
    //Bot.updateBalance(bet.uid, betResult.totalWin);
  }
};

module.exports = runGame;
