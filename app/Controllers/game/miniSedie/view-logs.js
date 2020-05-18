const Logger = require("./../../../web/logger");

const MiniSedieCuoc = require("./models/MiniSedie_cuoc");
const MiniSediePhien = require("./models/MiniSedie_phien");

const queryHistory = async (realPlayer, page, pageSize) => {
  const filter = { uid: realPlayer.UID, thanhtoan: true };
  const numberOfSkippedBets = (page - 1) * pageSize;
  const total = await MiniSedieCuoc.countDocuments(filter).exec();
  const roundProjection = { _id: false, time: false, __v: false, __archive: false };
  const betProjection = {
    _id: false,
    uid: false,
    thanhtoan: false,
    siteId: false,
    memberId: false,
    __v: false,
    __archive: false,
  };
  const bets = await MiniSedieCuoc.find(filter, betProjection, {
    sort: { _id: -1 },
    skip: numberOfSkippedBets,
    limit: pageSize,
  })
    .lean()
    .exec();
  let betLogs = [];

  if (bets && bets.length > 0) {
    betLogs = await Promise.all(
      bets.map(async (bet) => {
        const round = await MiniSediePhien.findOne({ id: bet.phien }, roundProjection).lean().exec();

        return { ...bet, ...round };
      })
    );
  }

  realPlayer.red({
    miniSedie: {
      viewlogs: {
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

    queryHistory(realPlayer, page, pageSize).catch(Logger.logError);
  }
};
