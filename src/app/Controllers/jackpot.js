const Jackpots = require("./../Models/Jackpot");
const UserInfos = require("./../Models/UserInfo");
const Logger = require("./../web/logger");

const getWinners = async (client, { limit }) => {
  const winnersFilter = {
    winnerName: { $exists: true },
  };
  const jackpotWinnersProjection = {
    _id: false,
    gameId: true,
    pool: true,
    winnerName: true,
    amount: true,
  };
  const sort = {
    hitTime: -1,
  };
  const jackpotWinnersWithoutAvatars = await Jackpots.find(winnersFilter, jackpotWinnersProjection, { sort, limit }).lean().exec();

  const winnerNames = jackpotWinnersWithoutAvatars.map((winner) => winner.winnerName);
  const avatarsFilter = { name: { $in: winnerNames } };
  const avatarsProjection = {
    _id: false,
    name: true,
    avatarId: true,
  };
  const avatars = await UserInfos.find(avatarsFilter, avatarsProjection).lean().exec();

  const jackpotWinners = jackpotWinnersWithoutAvatars.map((winner) => {
    const avatarId = avatars.find((avatar) => avatar.name === winner.winnerName)?.avatarId ?? 0;

    return { ...winner, avatarId };
  });

  client.red({ jackpotWinners });
};

const getPools = async (client) => {
  const runningPoolsFilter = {
    winnerName: { $exists: false },
  };
  const projection = {
    _id: false,
    gameId: true,
    pool: true,
    amount: true,
  };
  const jackpotPools = await Jackpots.find(runningPoolsFilter, projection).lean().exec();

  client.red({ jackpotPools });
};

module.exports = async (client, payload) => {
  try {
    if (payload?.getWinners) {
      await getWinners(client, payload.getWinners);
    }

    if (payload?.getPools) {
      await getPools(client);
    }
  } catch (err) {
    Logger.logError(err);
  }
};
