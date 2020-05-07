const BaccaratPhien = require("../../../Models/Baccarat/baccarat-phien");
const BaccaratCuoc = require("../../../Models/Baccarat/baccarat-cuoc");
const { userHistoryPagination } = require("./constants");
const logger = require("../../../web/logger");

module.exports = (client, data) => {
  const { page } = data;
  const { limit } = userHistoryPagination;

  if (!!page && page > 0) {
    BaccaratCuoc
      .find({ uid: client.UID, thanhtoan: true }, "-_id name phien player banker big small tie betwin", { sort: { _id: -1 }, skip: (page - 1) * limit, limit })
      .then((bets) => Promise.all(
        bets.map((bet) => BaccaratPhien
          .findOne({ id: bet.phien }, "-_id player banker result")
          .exec()
          .then((round) => ({ bet, round })))))
      .then((data) => BaccaratCuoc
        .countDocuments({ uid: client.UID, thanhtoan: true })
        .exec()
        .then((total) => ({ data, total })))
      .then(({ data, total }) => client.red({ baccarat: { history: { data, page, kmess: limit, total } } }))
      .catch((error) => logger.logError(error));
  }
};
