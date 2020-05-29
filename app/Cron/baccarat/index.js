const BaccaratPhien = require("../../Models/Baccarat/baccarat-phien");
const startGame = require("./game-handler");
const logger = require("./../../web/logger");

module.exports = io => {
  io.game.baccarat = {
    roundId: 1,
    remainingTime: 0,
    ingame: {},
    totalBets: { player: 0, banker: 0, big: 0, small: 0, tie: 0, playerPair: 0, bankerPair: 0 },
    totalBetsAdmin: { player: 0, banker: 0, big: 0, small: 0, tie: 0, playerPair: 0, bankerPair: 0 },
    clients: {},
    players: {},
    disabled: false,
    winClients: {},
    chips: {
      'player': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'banker': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'tie': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'big': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'small': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'playerPair': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'bankerPair': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 }
    },
    settlementResultFromAdmin: {
      roundId: 0,
      result: {
        player: [],
        banker: []
      },
    }
  };

  BaccaratPhien
    .findOne({}, "id", { sort: { _id: -1 } })
    .then(last => {
      if (!!last) {
        io.game.baccarat.roundId = last.id + 1;
      }

      startGame(io);
    })
    .catch(err => logger.logError(err));
};
