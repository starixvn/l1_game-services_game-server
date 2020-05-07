const inGame = require("./inGame");
const outGame = require("./outGame");
const placeBet = require("./placeBet").kenoProMaxPlaceBet;

module.exports = (client, data) => {
  if (!!data.ingame) {
    inGame(client);
  }

  if (!!data.outgame) {
    outGame(client);
  }

  if (!!data.cuoc) {
    placeBet(client, data.cuoc);
  }
};
