const BaccaratPhien = require("../../../Models/Baccarat/baccarat-phien");
const UserInfo = require("../../../Models/UserInfo");
const logger = require("../../../web/logger");

module.exports = (client) => {
  const baccarat = client.redT.game.baccarat;

  if (baccarat.realPlayers[client.UID] === client) {
    const { roundId, remainingTime, totalBets, chips, odds } = baccarat;

    const getRounds = ({ limit }) => BaccaratPhien
      .find({}, "-_id id player banker result", { sort: { _id: -1 }, limit })
      .then((rounds) => ({ rounds }));

    const getUserInfo = () =>
      UserInfo.findOne({ id: client.UID }, "-_id red avatarId")
        .lean()
        .then((user) => ({ user }));

    const metadata = {
      limit: 48,
      roundId,
    };

    Promise.all([getRounds, getUserInfo].map((action) => action(metadata)))
      .then((values) => values.reduce((result, value) => ({ ...result, ...value }), {}))
      .then((result) => {
        const { user, rounds } = result;
        const ownBets = baccarat.ingame[client.profile.name];
        const players = { ...baccarat.players };
        const player = { id: client.UID, name: client.profile.name, ...user };

        delete players[player.id];

        if (!baccarat.players[player.id]) {
          baccarat.players[player.id] = player;
        }

        const ingameData = {
          roundHistory: rounds,
          players,
          ownBets,
          remainingTime,
          totalBets,
          chips,
          odds,
        };

        client.red({ baccarat: ingameData });

        Object.values(baccarat.realPlayers).forEach((user) => {
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
