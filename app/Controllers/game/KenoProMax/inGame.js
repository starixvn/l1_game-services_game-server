const Constants = require("./../../../Cron/KenoProMax/constants");
const KenoProMaxPhien = require("./../../../Models/KenoProMax/KenoProMax_phien");
const KenoProMaxCuoc = require("./../../../Models/KenoProMax/KenoProMax_cuoc");
const KenoProMaxUser = require("./../../../Models/KenoProMax/KenoProMax_user");
const UserInfo = require("./../../../Models/UserInfo");
const Logger = require("./../../../web/logger");

const inGame = async (client, kenoProMaxData) => {
  const { roundId, remainingTime, totalBets, chips } = kenoProMaxData;
  const odds = Constants.odds;
  const maxNumberOfRounds = 48;

  const getRounds = (limit) =>
    KenoProMaxPhien.find({}, "id result", { sort: { id: -1 }, limit }).exec();
  const getUserInfo = (uid) =>
    UserInfo.findOne({ id: uid }, "red avatarId").exec();

  const [roundHistory, user] = await Promise.all([
    getRounds(maxNumberOfRounds),
    getUserInfo(client.UID),
  ]);
  const players = { ...kenoProMaxData.players };
  const player = {
    id: client.UID,
    name: client.profile.name,
    ...user,
  };
  const own = kenoProMaxData.ingame[client.profile.name];

  delete players[player.id];

  if (!kenoProMaxData.players[player.id]) {
    kenoProMaxData.players[player.id] = player;
  }

  if (!(await KenoProMaxUser.findOne({ uid: client.UID }).exec())) {
    KenoProMaxUser.create({ uid: client.UID });
  }

  const ingameData = {
    roundHistory,
    players,
    own,
    remainingTime,
    totalBets,
    chips,
    odds,
  };

  client.red({ kenoProMax: ingameData });

  Object.values(kenoProMaxData.clients).forEach((user) => {
    if (client !== user) {
      user.red({ kenoProMax: { ingame: player } });
    }
  });
};

module.exports = (client) => {
  let kenoProMaxData = client.redT.kenoProMax;

  if (kenoProMaxData.clients[client.UID] === client) {
    inGame(client, kenoProMaxData).catch((error) => Logger.logError(error));
  } else {
    client.red({ toGame: "MainGame" });
  }
};
