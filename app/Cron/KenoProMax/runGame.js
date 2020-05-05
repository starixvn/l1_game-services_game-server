const ConfigHelper = require("./../../Helpers/ConfigHelper");
const GameConfigs = require("./../../Models/GameConfig/GameConfigs");
const Logger = require("./../../web/logger");
const Constants = require("./constants");
const KenoProMaxPhien = require("./../../Models/KenoProMax/KenoProMax_phien");

let runGame = (inIO) => {
  const loopInterval = 1000;

  let io = inIO;
  let kenoProMaxData = io.kenoProMax || {};

  kenoProMaxData.disabled = false;
  kenoProMaxData.timer = Constants.roundDuration;

  let gameLoop = setInterval(() => {
    if (kenoProMaxData.timer === Constants.roundDuration) {
      runAtStartingRound(io, kenoProMaxData);
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
      settleRound(io, kenoProMaxData);
    } else if (kenoProMaxData.timer < Constants.placingBetDuration) {
      updateClientData(io);
    }
  }, loopInterval);

  return gameLoop;
};

let runAtStartingRound = (io, kenoProMaxData) => {
  GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProMax })
    .exec()
    .then((configs) => {
      ConfigHelper.updateConfig(ConfigHelper.GameTypes.KenoProMax, configs);
      kenoProMaxData.disabled = configs === null || configs.enabled;

      if (kenoProMaxData.disabled) {
        let disabledMessage = configs === null ? "" : configs.disabled_message;

        kenoProMaxData.timer = Constants.roundDuration;
        io.sendAllUser({
          kenoProMax: { um: true, um_message: disabledMessage },
        });

        return GameConfigs.updateOne(
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
};

let settleRound = (io, kenoProMaxData) => {
  // gen result.
  let result = [];

  KenoProMaxPhien.create({
    result: result,
    time: new Date(),
  }).then((newRound) => {
    if (!!newRound) {
      const finish = { result: result, roundId: newRound.id };

      kenoProMaxData.phien = finish.roundId + 1;

      settleBets(finish.roundId, result);
      // send result to clients
    }
  });
};

let settleBets = (roundId, result) => {

};

let settlementRules = {
  big: (totalPoints, amount) => totalPoints >= 811 ? amount * Constants.payoutRatio.big : 0,
  small: (totalPoints, amount) => totalPoints <= 810 ? amount * Constants.payoutRatio.small : 0,
  odd: (totalPoints, amount) => totalPoints % 2 === 1 ? amount * Constants.payoutRatio.odd : 0,
  even: (totalPoints, amount) => totalPoints % 2 === 0 ? amount * Constants.payoutRatio.even : 0,  
  metal: (totalPoints, amount) => 210 <= totalPoints && totalPoints <= 695 ? amount * Constants.payoutRatio.metal : 0,
  wood: (totalPoints, amount) => 696 <= totalPoints && totalPoints <= 763 ? amount * Constants.payoutRatio.wood : 0,
  water: (totalPoints, amount) => 764 <= totalPoints && totalPoints <= 855 ? amount * Constants.payoutRatio.water : 0,
  fire: (totalPoints, amount) => 856 <= totalPoints && totalPoints <= 923 ? amount * Constants.payoutRatio.fire : 0,
  earth: (totalPoints, amount) => 924 <= totalPoints && totalPoints <= 1410 ? amount * Constants.payoutRatio.earth : 0,
};

let updateClientData = (io) => {
  try {
    Object.values(io.clients).forEach((clients) => {
      clients.forEach((client) => {
        if (client.gameEvent && client.gameEvent.viewKenoProMax) {
          client.red({ kenoProMax: { client: io.kenoProMax.data } });
        }
      });
    });

    let adminData = {
      kenoProMax: {
        info: io.kenoProMax.dataAdmin,
        ingame: io.kenoProMax.ingame,
      },
    };

    Object.values(io.admins).forEach((admins) => {
      admins.forEach((admin) => {
        if (admin.gameEvent && admin.gameEvent.viewKenoProMax) {
          admin.red(adminData);
        }
      });
    });
  } catch (error) {
    logger.logError(error);
  }
};

module.exports = runGame;
