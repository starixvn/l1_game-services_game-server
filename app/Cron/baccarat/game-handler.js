const constants = require("./constant");
const BaccaratGame = require("./baccarat-game");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const baseCard = require("../../../data/card");
const logger = require('./../../web/logger');
const Helpers = require("../../Helpers/Helpers");
const BaccaratPhien = require("../../Models/Baccarat/baccarat-phien");
const GameConfigs = require('./../../Models/GameConfig/GameConfigs');

const getCards = () => {
  let cards = [...baseCard.card];

  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);

  return cards;
};

const onEndBetTime = io => {
  if (io.baccarat.time === constants.resetDataTime) {
    io.baccarat.data = { player: 0, banker: 0, big: 0, small: 0, tie: 0 };
    io.baccarat.dataAdmin = { player: 0, banker: 0, big: 0, small: 0, tie: 0 };
    io.ingame.red = {};
  }
};

const onBetTime = io => {
  try {
    const baccarat = io.baccarat;

    if (baccarat && baccarat.time == 44) {
      GameConfigs.findOne({ name: ConfigHelper.GameTypes.Baccarat }, function (err, data) {
        if (err) {
          logger.logError(err);
        }

        baccarat.disabled = data == null || !data.enabled;

        ConfigHelper.updateConfig(ConfigHelper.GameTypes.Baccarat, data);

        if (baccarat.disabled) {
          Object.values(baccarat.clients).forEach(function (client) {
            client.red && client.red({ baccarat: { um: true, um_message: data.disabled_message } });
          });

          GameConfigs.updateOne({ name: ConfigHelper.GameTypes.Baccarat }, { disabledround: baccarat.phien }, function (err, data) {
            if (err) logger.logError(err);
          });

          //reset time
          baccarat.time = 44;
        }
      });
    }

    if (baccarat && baccarat.time < constants.betTime && baccarat.time >= 0) {

      Object.values(baccarat.clients).forEach((client) => {
        client.red({ baccarat: { client: baccarat.data } });
      });

      if (io.admins) {
        let adminData = { baccarat: { info: baccarat.dataAdmin, ingame: baccarat.ingame } };

        Object.values(io.admins).forEach(function (admin) {
          admin.forEach(function (client) {
            if (client.gameEvent !== void 0
              && client.gameEvent.viewBaccarat !== void 0
              && client.gameEvent.viewBaccarat) {
              client.red(adminData);
            }
          });
        });

      }

    }

    if (!baccarat.disabled) {
      baccarat.time--;
    }
  } catch (error) {
    logger.logError(error);
  }
};

const onEndGameRound = (io, gameLoop) => {
  if (io.baccarat.time < 0) {
    clearInterval(gameLoop);
    io.baccarat.time = 0;

    try {
      const cards = getCards();
      const baccaratGame = new BaccaratGame(cards);
      let action = "";

      do {
        action = baccaratGame.getAction();
        baccaratGame[action]();
      } while (action !== BaccaratGame.Actions.finalComparison);

      BaccaratSession
        .create({ player: baccaratGame.player, banker: baccaratGame.banker })
        .then(record => {
          if (!!record) {
            io.baccarat.phien = record.id + 1;

            //TODO Settle
          }
        })
        .catch(error => logger.logError(error));
    }
    catch (error) {
      logger.logError(error);
    }
  }
};

module.exports = io => {
  const { betTime, waitTime } = constants;
  const groundTime = betTime + waitTime + 1;
  io.baccarat.time = groundTime;

  let gameLoop = setInterval(() => {
    try {
      if (!disabled) {
        io.baccarat.time--;
      }

      onBetTime(io);
      onEndBetTime(io);
      onEndGameRound(io, gameLoop);
    }
    catch (error) {
      logger.logError(error);
    }
  }, 1000);

  return gameLoop;
};
