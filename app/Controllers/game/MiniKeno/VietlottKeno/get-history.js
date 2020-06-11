const Logger = require("./../../../../web/logger");

const KenoVietlottCuoc = require("./models/KenoProViet_cuoc");
const KenoVietlottPhien = require("./models/KenoProViet_phien");

//TODO include running tickets
const queryHistory = async (player, page, pageSize) => {
  const filter = { uid: player.UID, thanhtoan: true };
  const numberOfSkippedBets = (page - 1) * pageSize;
  const total = await KenoVietlottCuoc.countDocuments(filter).exec();
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

  const bets = await KenoVietlottCuoc.find(filter, betProjection, {
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
        const round = await KenoVietlottPhien.findOne({ id: bet.phien }, roundProjection).lean().exec();

        return {
          ...bet,
          settlementResult: round.settlementResult,
          result: round.result,
        };
      })
    );
  }

  player.red({ kenoVietlott: { history: { betLogs, page, pageSize, total } } });
};

module.exports = (player, payload) => {
  if (!!payload.page) {
    const page = payload.page >> 0;
    const pageSize = 8;

    if (page < 1) {
      return;
    }

    queryHistory(player, page, pageSize).catch(Logger.logError);
  }
};
