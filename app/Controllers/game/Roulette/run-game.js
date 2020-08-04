const Chance = require("chance");
const CronJob = require("cron").CronJob;

const GameIds = require("./../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../apis/balanceApi");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");
const GameConfigs = require("./../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../web/logger");

const RoulettePhien = require("./Models/Roulette_phien");
const { RouletteOne, RouletteTmpOne } = require("./Models/Roulette_one");

const Constants = require("./constants");
const SettlementRules = require("./settlement-rules");

const chance = new Chance();

const runGame = (io) => {
  const job = new CronJob(
    "* * * * * *",
    () => proceed(io).catch(Logger.logError),
    () => {
      Logger.logError(
        `Roulette unexpectedly stopped at round #${io.roulette.roundId} because the calculated time of the next interval was negative.`
      );
      job.start();
    },
    true
  );
};

const proceed = async (io) => {
  const rouletteData = io.roulette;

  if (rouletteData.remainingTime === Constants.roundDuration) {
    await checkGameStatus(io);
  }

  if (!rouletteData.disabled) {
    rouletteData.remainingTime--;
  }

  if (rouletteData.remainingTime === Constants.placingBetDuration) {
    resetForNewRound(rouletteData);
  }

  if (rouletteData.remainingTime < 0) {
    rouletteData.remainingTime = Constants.roundDuration;
    await settleRound(io);
  } else if (rouletteData.remainingTime < Constants.placingBetDuration) {
    pushRunningRoundInfoToAllRealPlayers(io);
  }
};

const checkGameStatus = async (io) => {
  const rouletteData = io.roulette;
  const rouletteConfigs = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.Roulette });
  const previouslyDisabled = rouletteData.disabled;
  const configuredlyDisabled = !rouletteConfigs || !rouletteConfigs.enabled;

  ConfigHelper.updateConfig(ConfigHelper.GameTypes.Roulette, rouletteConfigs);

  if (rouletteData.disabled) {
    if (rouletteData.delayStartTime > 0) {
      rouletteData.delayStartTime--;
    } else if (!configuredlyDisabled) {
      rouletteData.delayStartTime = rouletteConfigs?.delayStartTime ?? 0;
    }
  }

  rouletteData.disabled = configuredlyDisabled || rouletteData.delayStartTime > 0;

  if (rouletteData.disabled) {
    const disabledMessage = rouletteConfigs?.disabled_message ?? "";
    const payload = { roulette: { um: true, um_message: disabledMessage } };

    rouletteData.remainingTime = Constants.roundDuration;

    io.sendAllUser(payload);
    io.sendAllAdmin(payload, Constants.viewName);

    if (!previouslyDisabled) {
      await GameConfigs.updateOne({ name: ConfigHelper.GameTypes.Roulette }, { disabledround: rouletteConfigs.roundId });
    }
  } else if (previouslyDisabled) {
    const gameConfigs = {
      minbet: rouletteConfigs.minbet,
      maxbet: rouletteConfigs.maxbet,
      choices_maxbet: rouletteConfigs.choices_maxbet,
      odds: rouletteConfigs.odds,
    };

    io.sendAllUser({ roulette: { remainingTime: rouletteData.remainingTime, gameConfigs } });
    io.sendAllAdmin({ roulette: { remainingTime: rouletteData.remainingTime, roundId: rouletteData.roundId } }, Constants.viewName);
  }
};

const resetForNewRound = (rouletteData) => {
  rouletteData.ingame = {};
  rouletteData.totalBets = {};
  rouletteData.winningPlayers = {};
};

const settleRound = async (io) => {
  const rouletteData = io.roulette;
  const result =
    rouletteData.roundId === rouletteData.settlementResultFromAdmin.roundId
      ? rouletteData.settlementResultFromAdmin.result
      : generateResult();
  const newRound = await RoulettePhien.create({ result, time: new Date() });

  if (newRound) {
    const finish = {
      result,
      roundId: newRound.id,
      time: newRound.time,
    };

    rouletteData.roundId = finish.roundId + 1;

    await settleBets(io, finish);
  }
};

const settleBets = async (io, finish) => {
  const realPlayersBets = await RouletteOne.find({ phien: finish.roundId }).exec();
  const botsBets = await RouletteTmpOne.find({ phien: finish.roundId }).exec();
  const allPlayersBets = realPlayersBets.concat(botsBets);

  if (allPlayersBets && allPlayersBets.length > 0) {
    const rouletteConfigs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Roulette);

    await Promise.all(
      allPlayersBets.map(async (bet) => {
        const betResult = calculateBetResult(finish.result, bet, rouletteConfigs.odds);

        bet.betwin = betResult.totalWin;
        bet.thanhtoan = true;

        await bet.save();
        notifyBetResult(io, bet.uid, betResult);
        callEndGame(bet, finish, betResult, io.users);
      })
    );
  }

  pushRoundResultToAllRealPlayers(io, finish);
};

const generateResult = () => chance.natural({ min: Constants.numberWheel.min, max: Constants.numberWheel.max });

const calculateBetResult = (generatedNumber, bet, odds) => {
  const betResult = Constants.typesOfBets.reduce(
    (result, typeOfBets) => {
      const choicesPerType = bet[typeOfBets];

      if (choicesPerType) {
        const betResultPerType = calculateEachTypeOfBetResult(generatedNumber, typeOfBets, choicesPerType, odds);

        result.totalBetAmount += betResultPerType.totalBetAmount;
        result.totalWin += betResultPerType.totalWin;
        result.netWin += betResultPerType.netWin;
        result.totalLost += betResultPerType.totalLost;
        result.winningByChoices[typeOfBets] = betResultPerType.winningByChoices;
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

const calculateEachTypeOfBetResult = (generatedNumber, typeOfBets, choicesPerType, odds) => {
  const settlementRule = SettlementRules[typeOfBets];
  const initialBetResult = {
    totalBetAmount: 0,
    totalWin: 0,
    netWin: 0,
    totalLost: 0,
    winningByChoices: {},
  };

  if (!settlementRule) {
    return initialBetResult;
  }

  return Object.entries(choicesPerType).reduce((result, [betChoice, betAmount]) => {
    const win = settlementRule(generatedNumber, betChoice);
    const winAmount = win ? betAmount * (odds[typeOfBets] || 1) : 0;

    result.totalBetAmount += betAmount;
    result.totalWin += winAmount;
    result.winningByChoices[betChoice] = winAmount;

    if (winAmount > 0) {
      result.netWin += winAmount - betAmount;
    } else {
      result.totalLost += betAmount;
    }

    return result;
  }, initialBetResult);
};

const callEndGame = (bet, finish, betResult, users) => {
  const gameInfo = {
    gameId: GameIds.roulette,
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

const pushRunningRoundInfoToAllRealPlayers = (io) => {
  const rouletteData = io.roulette;
  const adminData = {
    roulette: {
      totalBets: rouletteData.totalBets,
      ingame: rouletteData.ingame,
    },
  };

  Object.values(rouletteData.realPlayers).forEach((realPlayer) => {
    realPlayer.red({ roulette: { totalBets: rouletteData.totalBets } });
  });

  io.sendAllAdmin(adminData, Constants.viewName);
};

const pushRoundResultToAllRealPlayers = (io, finish) => {
  const rouletteData = io.roulette;

  Object.values(rouletteData.realPlayers).forEach((realPlayer) => {
    realPlayer.red({
      roulette: {
        finish: {
          roundId: finish.roundId,
          result: finish.result,
          winningPlayers: rouletteData.winningPlayers,
        },
      },
    });
  });

  io.sendAllAdmin({ roulette: { finish } }, Constants.viewName);
};

const notifyBetResult = (io, uid, betResult) => {
  const rouletteData = io.roulette;
  const status = { winningByChoices: betResult.winningByChoices };

  if (betResult.totalWin > 0) {
    status.win = true;
    status.bet = betResult.totalWin;
    rouletteData.winningPlayers[uid] = status;
  } else {
    status.win = false;
    status.bet = betResult.totalLost;
  }

  if (rouletteData.realPlayers[uid]) {
    rouletteData.realPlayers[uid].red({ rouletteData: { status } });
  } else if (io.users[uid]) {
    // Send latest balance to players who are not in the room anymore.
    io.users[uid].forEach((outGameRealPlayer) => {
      BalanceApi.getBalance({ id: outGameRealPlayer.UID }, outGameRealPlayer, (balance) => {
        if (balance) {
          outGameRealPlayer.red({ user: { red: balance.red, currency: balance.currency } });
        }
      });
    });
  }
};

module.exports = runGame;
