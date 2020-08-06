var chuyen = require("./history/chuyen");
var taixiu = require("./history/taixiu");
var baucua = require("./history/baucua");
var xocxoc = require("./history/xocxoc");
var txturbo = require("./history/txturbo");
var miniDragonTiger = require("./history/mini_dragon_tiger");

module.exports = function (client, data) {
  if (!!data.chuyen) {
    chuyen(client, data.chuyen);
  }
  if (!!data.taixiu) {
    taixiu(client, data.taixiu);
  }
  if (!!data.baucua) {
    baucua(client, data.baucua);
  }
  if (!!data.xocxoc) {
    xocxoc(client, data.xocxoc);
  }
  if (!!data.taixiu_turbo) {
    txturbo(client, data.taixiu_turbo);
  }
  if (!!data.mini_dragon_tiger) {
    miniDragonTiger(client, data.mini_dragon_tiger);
  }
};
