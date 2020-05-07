const KenoProMaxPhien = require("./../../Models/KenoProMax/KenoProMax_phien");
const Constants = require("./constants");
const runGame = require("./runGame");

module.exports = function (inIO) {
  let io = inIO;

  io.kenoProMax = {
    roundId: 1,
    remainingTime: 0,
    ingame: {},
    data: { ...Constants.resetData },
    adminData: { ...Constants.resetData },
    chips: [],
    clients: {},
    winClients: {},
    players: {},
    disabled: false,
  };

  KenoProMaxPhien.findOne({}, "id", { sort: { _id: -1 } }).then((lastRound) => {
    if (!!lastRound) {
      io.kenoProMax.phien = lastRound.id + 1;
    }
  });

  runGame(io);
};
