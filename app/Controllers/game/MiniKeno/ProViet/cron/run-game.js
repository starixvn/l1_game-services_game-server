const moment = require("moment");

const GameConfigs = require("./../../../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../../../web/logger");
const ConfigHelper = require("./../../../../../Helpers/ConfigHelper");

const Constants = require("./../constants");
const settleBets = require("./../settle-bets");
const constants = require("./../constants");

const runGame = (inIO) => {
  const loopInterval = 1000;
  const io = inIO;
  const kenoProVietData = io.kenoProViet || {};  

  kenoProVietData.remainingTime = getRemainingTime(kenoProVietData.roundEndTime);
  kenoProVietData.disabled = false;

  const gameLoop = setInterval(() => {
    proceed(io, kenoProVietData, gameLoop).catch((err) => {
      Logger.logError(err);
      console.log(err);
    });
  }, loopInterval);

  return gameLoop;
};

const getRemainingTime = (roundEndTime) => {
  const now = moment.now();
  const endRound = moment(roundEndTime);
  const duration = moment.duration(endRound.diff(now));

  return duration.get("minutes") * 60 + duration.get("seconds");
}

const proceed = async (io, kenoProVietData, gameLoop) => {
  if (kenoProVietData.remainingTime === Constants.durations.wholeRound) {
    await checkGameStatus(io);
  }

  if (!kenoProVietData.disabled && kenoProVietData.remainingTime > 0) {
    kenoProVietData.remainingTime--;
  }

  if (kenoProVietData.remainingTime <= 0 && kenoProVietData.finished) {
    kenoProVietData.remainingTime = 0;

    clearInterval(gameLoop);
    await settleBets(io, kenoProVietData.finishedRound);

    resetForNewRound(kenoProVietData);

    runGame(io);
  } else if (kenoProVietData.remainingTime < Constants.durations.placingBets) {
    pushRunningRoundInfoToAllRealPlayers(io);
  }
};

const checkGameStatus = async (io) => {
  const kenoProVietData = io.kenoProViet || {};
  const config = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProViet }).lean().exec();
  const configuredlyDisabled = !config || !config.enabled;
  const previouslyDisabled = config.disabled;

  if (kenoProVietData.disabled) {
    if (kenoProVietData.delayStartTime > 0) {
      kenoProVietData.delayStartTime--;
    } else if (!configuredlyDisabled) {
      kenoProVietData.delayStartTime = config && config.delayStartTime ? config.delayStartTime : 0;
    }
  }

  kenoProVietData.disabled = configuredlyDisabled || kenoProVietData.delayStartTime > 0;

  if (kenoProVietData.disabled) {
    const disabledMessage = config ? config.disabled_message : "";

    kenoProVietData.remainingTime = constants.durations.wholeRound;
    io.sendAllUser({ kenoProViet: { um: true, um_message: disabledMessage } });

    if (!previouslyDisabled) {
      await GameConfigs.updateOne({ name: ConfigHelper.GameTypes.KenoProViet }, { disabledround: kenoProVietData.roundId });
    }
  } else if (previouslyDisabled) {
    io.sendAllUser({
      kenoProViet: {
        remainingTime: kenoProVietData.remainingTime,
        gameConfigs: {
          minbet: config.minbet,
          maxbet: config.maxbet,
          choices_maxbet: config.choices_maxbet,
          odds: config.odds,
        },
      },
    });
  } else {
    io.sendAllUser({ kenoProViet: { remainingTime: kenoProVietData.remainingTime } });
  }
};

const resetForNewRound = (kenoProVietData) => {
  delete kenoProVietData.ingame[kenoProVietData.roundId];

  //TODO get latest phien for id and endTime from db
  kenoProVietData.roundId += 1;
  kenoProVietData.roundEndTime = new Date();

  //reset data received from Admin2
  kenoProVietData.finished = false;
  kenoProVietData.finishedRound = {};
};

const pushRunningRoundInfoToAllRealPlayers = (io) => {
  const kenoProVietData = io.kenoProViet || {};
  const adminData = {
    kenoProViet: {
      ingame: kenoProVietData.ingame,
    },
  };

  //TODO what to be sent?
  // Object.values(io.users).forEach((clients) => {
  //   clients.forEach((client) => {
  //     if (client.gameEvent && client.gameEvent.viewkenoProViet) {
  //       client.red({ kenoProViet: { totalBets: kenoProVietData.totalBets } });
  //     }
  //   });
  // });

  Object.values(io.admins).forEach((admin) => {
    admin.forEach((client) => {
      if (client.gameEvent && client.gameEvent.viewkenoProViet) {
        client.red(adminData);
      }
    });
  });
};

module.exports = runGame;
