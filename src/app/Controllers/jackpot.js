const Jackpots = require("./../Models/Jackpot");
const Logger = require("./../web/logger");

const getWinners = async (client, { limit }) => {
  const winnersFilter = {
    winnerName: { $exists: true },
  };
  const projection = {
    _id: false,
    gameId: true,
    pool: true,
    winnerName: true,
    amount: true,
  };
  const sort = {
    hitTime: -1,
  };
  const jackpotWinners = await Jackpots.find(winnersFilter, projection, { sort, limit }).lean().exec();

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
      await getWinners(payload.getWinners);
    }

    if (payload?.getPools) {
      await getPools(client);
    }
  } catch (err) {
    Logger.logError(err);
  }
};
