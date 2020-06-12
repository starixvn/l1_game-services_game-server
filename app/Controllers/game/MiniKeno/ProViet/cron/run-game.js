const GameIds = require("./../../../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../../../apis/balanceApi");
const ConfigHelper = require("./../../../../../Helpers/ConfigHelper");
const GameConfigs = require("./../../../../../Models/GameConfig/GameConfigs");
const Logger = require("./../../../../../web/logger");

const Constants = require("./../constants");
const settleBets = require("./../settle-bets");

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
  kenoProVietData.roundId +=1;

  kenoProVietData.ingame = {};//reset data of correct round  
  kenoProVietData.roundStartTime = new Date(); //TODO startTime of round

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
