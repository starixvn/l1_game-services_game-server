const ingame = require("./XocXoc/ingame");
const outgame = require("./XocXoc/outgame");
const cuoc = require("./XocXoc/cuoc").xocxocCuoc;
const history = require("./XocXoc/history");

module.exports = function (client, data) {
  if (!!data.ingame) {
    ingame(client);
  }
  if (!!data.outgame) {
    outgame(client);
  }
  if (!!data.cuoc) {
    cuoc(client, data.cuoc);
  }
  if (!!data.log) {
    history(client, data.log);
  }
  client = null;
  data = null;
};
