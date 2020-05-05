const BaccaratPhien = require("../../../Models/Baccarat/baccarat-phien");
const BaccaratCuoc = require("../../../Models/Baccarat/baccarat-cuoc");
const { userHistoryPagination } = require("./constants");
const logger = require("../../../web/logger");

module.exports = (client, data) => {
  const { page } = data;
  const { limit } = userHistoryPagination;

  if (!!page) {
    const { red, page } = page;

    if (page > 0) {
      BaccaratCuoc.find(
        { uid: client.UID, red: red, thanhtoan: true },
        "-__v -_id -thanhtoan -uid -red",
        {
          sort: { _id: -1 },
          skip: (page - 1) * limit,
          limit,
        }
      )
        .then((bets) =>
          Promise.all(
            bets.map((bet) =>
              BaccaratPhien.findOne({ id: bet.phien }, "player banker")
                .exec()
                .then((round) => ({ ...bet, round }))
            )
          )
        )
        .then((data) =>
          BaccaratCuoc.countDocuments({
            uid: client.UID,
            red: red,
            thanhtoan: true,
          })
            .exec()
            .then((total) => ({
              data,
              total,
            }))
        )
        .then(({ data, total }) => {
          client.red({
            baccarat: {
              history: { data, page, kmess: limit, total },
            },
          });
        })
        .catch((error) => logger.logError(error));
    }
  }
};
