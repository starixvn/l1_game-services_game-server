const XocXoc = require("./XocXoc/reg");
const KenoProMax = require("./KenoProMax/reg");
const baccaratHandler = require("./baccarat/player-handler");

module.exports = function (client, game) {
  switch (game) {
    case "XocXoc":
      XocXoc(client);
      break;
    case "KenoProMax":
      KenoProMax(client);
      break;
    case "baccarat":
      baccaratHandler.registerBaccarat(client);
      break;
  }

  client = null;
  game = null;
};
