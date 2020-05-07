let XocXoc = require("./XocXoc/reg");
let KenoProMax = require("./KenoProMax/reg");

module.exports = function (client, game) {
  switch (game) {
    case "XocXoc":
      XocXoc(client);
      break;
    case "KenoProMax":
      KenoProMax(client);
      break;
  }

  client = null;
  game = null;
};
