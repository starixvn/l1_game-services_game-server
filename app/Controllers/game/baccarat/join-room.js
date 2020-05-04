const BaccaratPhien = require("../../../Models/Baccarat/baccarat-phien");
const BaccaratCuoc = require("../../../Models/Baccarat/baccarat-cuoc");
const UserInfo = require("../../../Models/UserInfo");
const logger = require("../../../web/logger");

module.exports = (client) => {
  const baccarat = client.redT.game.baccarat;

  if (baccarat.clients[client.UID] === client) {
    const { phien, time, data, chip } = baccarat;

    const getRounds = ({ limit }) =>
      BaccaratPhien.find({}, "id player banker", {
        sort: { _id: -1 },
        limit,
      }).then((rounds) => ({ logs: rounds }));

    const getBet = ({ roundId }) =>
      BaccaratCuoc.find({ phien: roundId }, "-_id", {
        sort: { _id: -1 },
      }).then((bets) => ({ cuoc: bets }));

    const getUserInfo = () =>
      UserInfo.findOne({ id: client.UID }, "red avatarId").then((user) => ({
        user,
      }));

    const metadata = {
      limit: 48,
      roundId: phien,
    };

    Promise.all(
      [getRounds, getBet, getUserInfo].map((action) => action(metadata))
    )
      .then((values) =>
        values.reduce((result, value) => ({ ...result, ...value }), {})
      )
      .then((result) => {
        const { cuoc, user, logs } = result;
        const me = baccarat.ingame[client.profile.name];
        const players = { ...baccarat.players };
        const player = {
          id: client.UID,
          name: client.profile.name,
          ...user,
        };

        delete players[player.id];

        if (!baccarat.players[player.id]) {
          baccarat.players[player.id] = player;
        }

        const ingameData = {
          time,
          data,
          chip,
          logs,
          cuoc,
          me,
          players,
        };

        client.red({ baccarat: { ingame: ingameData } });

        Object.values(baccarat.clients).forEach((user) => {
          if (client !== user) {
            user.red({ baccarat: { ingame: { player } } });
          }
        });
      })
      .catch((error) => logger.logError(error));
  } else {
    client.red({ toGame: "MainGame" });
  }
};
