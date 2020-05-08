const KenoProMaxCuoc = require("../../../Models/KenoProMax/KenoProMax_cuoc");
const KenoProMaxPhien = require("../../../Models/KenoProMax/KenoProMax_phien");
const Logger = require("../../../web/logger");

const queryHistory = async (realPlayer, page, pageSize) => {
  const filter = { uid: realPlayer.UID, thanhtoan: true };
  const numberOfSkippedBets = (page - 1) * pageSize;
  const total = await KenoProMaxCuoc.countDocuments(filter).exec();
  const bets = await KenoProMaxCuoc.find(
    filter,
    {
      _id: 0,
      uid: 0,
      thanhtoan: 0,
      __v: 0,
      __archive: 0,
    },
    { sort: { _id: -1 }, skip: numberOfSkippedBets, limit: pageSize }
  ).exec();
  let betLogs = [];

  if (bets && bets.length > 0) {
    betLogs = await Promise.all(
      bets.map(async (bet) => {
        const round = await KenoProMaxPhien.findOne({ id: bet.phien }).exec();

        return { ...bet, result: round.result };
      })
    );
  }

  realPlayer.red({
    kenoProMax: {
      history: {
        betLogs,
        page,
        pageSize,
        total,
      },
    },
  });
};

module.exports = (realPlayer, data) => {
  if (!!data.page) {
    const page = data.page >> 0;
    const pageSize = 8;

    if (page < 1) {
      return;
    }

    queryHistory(realPlayer, page, pageSize).catch((error) =>
      Logger.logError(error)
    );
  }
};
