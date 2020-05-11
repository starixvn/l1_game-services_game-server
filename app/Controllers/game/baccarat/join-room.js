const BaccaratPhien = require("../../../Models/Baccarat/baccarat-phien");
const BaccaratCuoc = require("../../../Models/Baccarat/baccarat-cuoc");
const UserInfo = require("../../../Models/UserInfo");
const logger = require("../../../web/logger");

module.exports = (client) => {
  const baccarat = client.redT.game.baccarat;

  if (baccarat.clients[client.UID] === client) {
    const { roundId, remainingTime, totalBets, chips } = baccarat;

    const getRounds = ({ limit }) => BaccaratPhien
      .find({}, "-_id id player banker result", { sort: { _id: -1 }, limit })
      .then((rounds) => ({ rounds }));

    const getBet = ({ roundId }) => BaccaratCuoc
      .find({ phien: roundId }, "-_id", { sort: { _id: -1 } })
      .then((bets) => ({ bets }));

    const getUserInfo = () => UserInfo.findOne({ id: client.UID }, "red avatarId").then((user) => ({ user }));

    const metadata = {
      limit: 48,
      roundId,
    };

    Promise.all([getRounds, getBet, getUserInfo].map((action) => action(metadata)))
      .then((values) => values.reduce((result, value) => ({ ...result, ...value }), {}))
      .then((result) => {
        const { bets, user, rounds } = result;
        const own = baccarat.ingame[client.profile.name];
        const players = { ...baccarat.players };
        const player = { id: client.UID, name: client.profile.name, ...user };

        delete players[player.id];

        if (!baccarat.players[player.id]) {
          baccarat.players[player.id] = player;
        }

        const ingameData = { remainingTime, totalBets, chips, roundHistory: rounds, bets, own, players };

        client.red({ baccarat: ingameData });

        Object.values(baccarat.clients).forEach((user) => {
          if (client !== user) {
            user.red({ baccarat: { player } });
          }
        });
      })
      .catch((error) => logger.logError(error));
  } else {
    client.red({ toGame: "MainGame" });
  }
};
