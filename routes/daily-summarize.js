const BAUCUA = require("../app/Models/BauCua/BauCua_cuoc");
const BAUCUA_PHIEN = require("../app/Models/BauCua/BauCua_phien");
const XOCXOC = require("../app/Models/XocXoc/XocXoc_cuoc");
const XOCXOC_PHIEN = require("../app/Models/XocXoc/XocXoc_phien");
const TAIXIU = require("../app/Models/TaiXiu_one");
const TAIXIU_PHIEN = require("../app/Models/TaiXiu_phien");
const TXTURBO = require("../app/Models/TXTurbo/TXTurbo_one");
const TXTURBO_PHIEN = require("../app/Models/TXTurbo/TXTurbo_phien");
const CHANLE = require("../app/Models/ChanLe/ChanLe_one");
const CHANLE_PHIEN = require("../app/Models/ChanLe/ChanLe_phien");
const CHANLETURBO = require("../app/Models/ChanLeTurbo/ChanLeTurbo_one");
const CHANLETURBO_PHIEN = require("../app/Models/ChanLeTurbo/ChanLeTurbo_phien");
const MINIDRAGONTIGER = require("../app/Models/MiniDragonTiger/MiniDragonTiger_cuoc");
const MINIDRAGONTIGER_PHIEN = require("../app/Models/MiniDragonTiger/MiniDragonTiger_phien");
const KENOPROMAX = require("../app/Models/KenoProMax/KenoProMax_cuoc");
const KENOPROMAX_PHIEN = require("../app/Models/KenoProMax/KenoProMax_phien");
const logger = require("../app/web/logger");
const {
  lowercaseFirstCharacter,
  errors,
  toFixed,
  useAuthenticate,
} = require("./util");

const getAggregate = (
  stake,
  roundId,
  payout = {
    $sum: "$betwin",
  }
) => [
  {
      $match: {
        thanhtoan: true,
        memberId: {
          $exists: true
        },
        phien: roundId
      }
  },
  {
    $group: {
      _id: "$uid",
      stake,
      payout,
      ticketCount: {
        $sum: 1,
      },
    },
  },
  {
    $lookup: {
      from: "userinfos",
      localField: "_id",
      foreignField: "id",
      as: "users",
    },
  },
  {
    $group: {
        _id: {
          $arrayElemAt: ["$users.currency", 0]
        },
      stake: { $sum: "$stake" },
      payout: { $sum: "$payout" },
      ticketCount: { $sum: "$ticketCount" },
    },
  },
];

const metadata = [
  async (sessionQuery) => {
    // Bau cua
    const stake = {
      $sum: {
        $sum: ["$0", "$1", "$2", "$3", "$4", "$5"],
      },
    };

    const sessions = await BAUCUA_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        BAUCUA.aggregate(getAggregate(stake, id))
      )
    );
  },
  async (sessionQuery) => {
    // Xoc xoc
    const stake = {
      $sum: {
        $sum: ["$chan", "$le", "$red3", "$red4", "$white3", "$white4"],
      },
    };

    const sessions = await XOCXOC_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        XOCXOC.aggregate(getAggregate(stake, id))
      )
    );
  },
  async (sessionQuery) => {
    // Tai xiu
    const stake = {
      $sum: "$bet",
    };
      )
    );
  },
  async (sessionQuery) => {
    // Tai xiu
    const stake = {
      $sum: "$bet",
    };

    const payout = {
      $sum: {
        $cond: {
          if: {
            $eq: ["$win", true],
          },
          then: {
            $sum: ["$betwin", "$bet"],
          },
          else: "$tralai",
        },
      },
    };

    const sessions = await TAIXIU_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        TAIXIU.aggregate(getAggregate(stake, id, payout))
      )
    );
  },
  async (sessionQuery) => {
    // Tai xiu turbo
    const stake = {
      $sum: "$bet",
    };

    const payout = {
      $sum: {
        $cond: {
          if: {
            $eq: ["$win", true],
          },
          then: {
            $sum: ["$betwin", "$bet"],
          },
          else: "$tralai",
        },
      },
    };

    const sessions = await TXTURBO_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        TXTURBO.aggregate(getAggregate(stake, id, payout))
      )
    );
  },
  async (sessionQuery) => {
    // Chan le
    const stake = {
      $sum: "$bet",
    };

    const payout = {
      $sum: {
        $cond: {
          if: {
            $eq: ["$win", true],
          },
          then: {
            $sum: ["$betwin", "$bet"],
          },
          else: "$tralai",
        },
      },
    };

    const sessions = await CHANLE_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        CHANLE.aggregate(getAggregate(stake, id, payout))
      )
    );
  },
  async (sessionQuery) => {
    // Chan le turbo
    const stake = {
      $sum: "$bet",
    };

    const payout = {
      $sum: {
        $cond: {
          if: {
            $eq: ["$win", true],
          },
          then: {
            $sum: ["$betwin", "$bet"],
          },
          else: "$tralai",
        },
      },
    };

    const sessions = await CHANLETURBO_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        CHANLETURBO.aggregate(getAggregate(stake, id, payout))
      )
    );
  },
  async (sessionQuery) => {
    // mini dragon tiger
    const stake = {
      $sum: {
        $sum: ["$dragon", "$tiger", "$tie"],
      },
    };

    const sessions = await MINIDRAGONTIGER_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map(({ id }) =>
        MINIDRAGONTIGER.aggregate(getAggregate(stake, id))
      )
    );
  },
  async (sessionQuery) => {
    // keno pro max
    const stake = {
      $sum: {
        $sum: [
          "big",
          "small",
          "odd",
          "even",
          "metal",
          "wood",
          "water",
          "fire",
          "earth",
        ],
      },
    };
    const getMatch = ({ id }) => ({
      phien: id
    });

    const sessions = await KENOPROMAX_PHIEN.find(sessionQuery).exec();

    return await Promise.all(
      sessions.map((session) =>
        KENOPROMAX.aggregate(getAggregate(stake, getMatch(session)))
      )
    );
  },
];

const handleRequest = (params, res) => {
  const currentDate = new Date(params.summarizedDate);
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + 1);

  const sessionQuery = {
    time: { $gte: currentDate, $lt: nextDate },
  };

  Promise.all(metadata.map((getSummary) => getSummary(sessionQuery)))
    .then((data) => data.flat(2))
    .then((data) =>
      data.reduce((summary, element) => {
        if (summary[element._id]) {
          summary[element._id].stake += element.stake;
          summary[element._id].payout += element.payout;
          summary[element._id].ticketCount += element.ticketCount;
        } else {
          summary[element._id] = element;
        }
        return summary;
      }, {})
    )
    .then((summary) =>
      Object.keys(summary).map((currency) => {
        const summaryByCurrency = summary[currency];
        delete summaryByCurrency._id;
        summaryByCurrency.currency = currency;
        summaryByCurrency.stake = toFixed(summaryByCurrency.stake, 2);
        summaryByCurrency.payout = toFixed(summaryByCurrency.payout, 2);

        return summaryByCurrency;
      })
    )
    .then((summary) => res.send({ summary }))
    .catch((error) => {
      logger.logError(error);
      res.send(errors.SB1000);
    });
};

module.exports = function (app) {
  app.post(
    "/api/dailysummarize",
    useAuthenticate({
      logger: {
        error: logger.logError,
        warn: logger.logWarning,
      },
    }),
    lowercaseFirstCharacter,
    (req, res) => handleRequest(req.body, res)
  );
};
