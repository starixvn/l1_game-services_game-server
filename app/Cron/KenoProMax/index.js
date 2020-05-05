const KenoProMaxPhien = require("./../../Models/KenoProMax/KenoProMax_phien");
const Constants = require("./constants");
const runGame = require("./runGame");

module.exports = function (inIO) {
  let io = inIO;

  io.kenoProMax = {
    phien: 1,
    timer: 0,
    ingame: {},
    data: { ...Constants.resetData },
    adminData: { ...Constants.resetData },
    clients: {},
    winClients: {},
    players: {},
    disabled: false,
  };

  KenoProMaxPhien.findOne({}, "id", { sort: { _id: -1 } }).then((last) => {
    if (!!last) {
      io.kenoProMax.phien = last.id + 1;
    }
  });

  runGame(io);
};
