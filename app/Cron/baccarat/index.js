const BaccaratPhien = require("../../Models/Baccarat/baccarat-phien");
const startGame = require("./game-handler");
const logger = require("./../../web/logger");

module.exports = io => {
  io.game.baccarat = {
    phien: 1,
    time: 0,
    ingame: {},
    data: { player: 0, banker: 0, big: 0, small: 0, tie: 0 },
    dataAdmin: { player: 0, banker: 0, big: 0, small: 0, tie: 0 },
    clients: {},
    players: {},
    disabled: false,
    winClients: {},
    chip: {
      'player': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'banker': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'tie': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'big': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 },
      'small': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0, '500': 0 }
    }
  };

  BaccaratPhien
    .findOne({}, "id", { sort: { _id: -1 } })
    .then(last => {
      if (!!last) {
        io.game.baccarat.phien = last.id + 1;
      }

      startGame(io);
    })
    .catch(err => logger.logError(err));
};
