let inGame = require("./inGame");
let outGame = require("./outGame");
let placeBet = require("./placeBet").kenoProMaxPlaceBet;

module.exports = function (client, data) {
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
