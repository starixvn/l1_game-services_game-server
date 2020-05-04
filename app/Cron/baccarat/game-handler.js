const constants = require("./constant");
const BaccaratGame = require("./baccarat-game");
const ConfigHelper = require("./../../Helpers/ConfigHelper");
const baseCard = require("../../../data/card");
const logger = require('./../../web/logger');
const Helpers = require("../../Helpers/Helpers");

BaccaratSession = require("../../Models/Baccarat/baccarat-phien");

const getCards = () => {
  let cards = [...baseCard.card];

  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);
  cards = Helpers.shuffle(cards);

  return cards;
};

const onEndBetTime = io => {
  if (io.baccarat.time === constants.betTime) {
    // TODO reset data
  }
};

const onBetTime = io => {
  if (io.baccarat.time < constants.betTime && io.baccarat.time >= 0) {
    // TODO OnBetTime
  }
};

const onEndSession = (io, gameLoop) => {
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
  const gameConfig = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Baccarat);
  let disabled = false;
  io.miniBaccarat.time = groundTime;

  let gameLoop = setInterval(() => {
    if (!disabled) {
      io.baccarat.time--;
    }

    onBetTime(io);
    onEndBetTime(io);
    onEndSession(io, gameLoop);
  }, 1000);

  return gameLoop;
};
