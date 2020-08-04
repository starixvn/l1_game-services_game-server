const LuckyWheelRound = require("./Models/LuckyWheel_phien");
const Logger = require("../../../web/logger");

const queryHistory = async (player, page, pageSize) => {
  const filter = { uid: player.UID };
  const numberOfSkippedBets = (page - 1) * pageSize;
  const total = await LuckyWheelRound.countDocuments(filter).exec();
  const betProjection = {
    _id: false,
    uid: false,
    siteId: false,
    memberId: false,
    __v: false,
    __archive: false,
  };

  const spinHistories = await LuckyWheelRound.find(filter, betProjection, { sort: { _id: -1 }, skip: numberOfSkippedBets, limit: pageSize })
    .lean()
    .exec();

  player.red({ miniSedie: { history: { spinHistories, page, pageSize, total } } });
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
