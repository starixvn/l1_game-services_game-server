const Constants = require("./../../../Cron/KenoProMax/constants");
const KenoProMaxPhien = require("./../../../Models/KenoProMax/KenoProMax_phien");
const KenoProMaxUser = require("./../../../Models/KenoProMax/KenoProMax_user");
const UserInfo = require("./../../../Models/UserInfo");
const Logger = require("./../../../web/logger");

const inGame = async (realPlayer, kenoProMaxData) => {
  const { remainingTime, totalBets, chips } = kenoProMaxData;
  const odds = Constants.odds;
  const maxNumberOfRounds = 48;

  const getRounds = (limit) =>
    KenoProMaxPhien.find({}, "id result", { sort: { id: -1 }, limit }).exec();
  const getUserInfo = (uid) =>
    UserInfo.findOne({ id: uid }, "red avatarId").exec();

  const [roundHistory, user] = await Promise.all([
    getRounds(maxNumberOfRounds),
    getUserInfo(realPlayer.UID),
  ]);
  const players = { ...kenoProMaxData.players };
  const player = {
    id: realPlayer.UID,
    name: realPlayer.profile.name,
    ...user,
  };
  const own = kenoProMaxData.ingame[realPlayer.profile.name];

  delete players[player.id];

  if (!kenoProMaxData.players[player.id]) {
    kenoProMaxData.players[player.id] = player;
  }

  if (!(await KenoProMaxUser.findOne({ uid: realPlayer.UID }).exec())) {
    KenoProMaxUser.create({ uid: realPlayer.UID });
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

  realPlayer.red({ kenoProMax: ingameData });

  Object.values(kenoProMaxData.realPlayers).forEach((joinedPlayer) => {
    if (realPlayer !== joinedPlayer) {
      joinedPlayer.red({ kenoProMax: { ingame: player } });
    }
  });
};

module.exports = (realPlayer) => {
  let kenoProMaxData = realPlayer.redT.kenoProMax;

  if (kenoProMaxData.realPlayers[realPlayer.UID] === realPlayer) {
    inGame(realPlayer, kenoProMaxData).catch((error) => Logger.logError(error));
  } else {
    realPlayer.red({ toGame: "MainGame" });
  }
};
