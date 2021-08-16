// Reg game
let reg = require("./game/reg");

module.exports = function (client, data) {
  if (!!data.reg) {
    reg(client, data.reg);
  }
};
