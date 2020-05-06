let KenoProMaxPhien = require("../../../Models/KenoProMax/KenoProMax_phien");
let KenoProMaxCuoc = require("../../../Models/KenoProMax/KenoProMax_cuoc");
let UserInfo = require("../../../Models/UserInfo");
const logger = require("../../../web/logger");

module.exports = function (client) {
  let kenoProMaxData = client.redT.kenoProMax;

  if (kenoProMaxData.clients[client.UID] === client) {
    const { phien: roundId, timer } = kenoProMaxData;
    const maxNumberOfRounds = 48;

    const getRounds = (limit) =>
      KenoProMaxPhien.find({}, "id result", {
        sort: { id: -1 },
        limit: limit,
      })
        .exec()
        .then((rounds) => ({ rounds }));
    const getBets = (roundId) =>
      KenoProMaxCuoc.find({ phien: roundId }, "-_id", {
        sort: { _id: -1 },
      })
        .exec()
        .then((bets) => ({ bets }));
    const getUserInfo = (uid) =>
      UserInfo.findOne({ id: uid }, "red avatarId")
        .exec()
        .then((user) => ({ user }));

    Promise.all([
      getRounds(maxNumberOfRounds),
      getBets(roundId),
      getUserInfo(client.UID),
    ])
      .then((values) =>
        values.reduce((result, value) => ({ ...result, ...value }), {})
      )
      .then((result) => {
        const { rounds, bets, user } = result;
        const players = { ...kenoProMaxData.players };
        const player = { id: client.UID, name: client.profile.name, ...user };
        const me = kenoProMaxData.ingame[client.profile.name];

        delete players[player.id];

        if (!kenoProMaxData.players[player.id]) {
          kenoProMaxData.players[player.id] = player;
        }

        const ingameData = { rounds, bets, players, me, timer };

        client.red({ kenoProMax: { ingame: ingameData } });

        Object.values(kenoProMaxData.clients).forEach((user) => {
          if (client !== user) {
            user.red({ kenoProMax: { ingame: player } });
          }
        });
      })
      .catch((error) => logger.logError(error));
  } else {
    client.red({ toGame: "MainGame" });
  }
};
