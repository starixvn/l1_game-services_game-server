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
const MINISEDIE = require("../app/Controllers/game/miniSedie/models/MiniSedie_cuoc");
const MINISEDIE_PHIEN = require("../app/Controllers/game/miniSedie/models/MiniSedie_phien");
const BACCARAT = require("../app/Models/Baccarat/baccarat-cuoc");
const BACCARAT_PHIEN = require("../app/Models/Baccarat/baccarat-phien");
const KENOPROVIET = require("../app/Controllers/game/MiniKeno/ProViet/models/bet-models").KenoProViet_one;
const KENOPROVIET_PHIEN = require("../app/Controllers/game/MiniKeno/ProViet/models/KenoProViet_phien");
const { KenoMax_one, KenoMax_phien } = require("../app/Controllers/game/MiniKeno/Max/models");
const { KenoMax2_one, KenoMax2_phien } = require("../app/Controllers/game/MiniKeno/Max2/models");
const { KenoMini_one, KenoMini_phien } = require("../app/Controllers/game/MiniKeno/Mini/models");
const { KenoMini2_one, KenoMini2_phien } = require("../app/Controllers/game/MiniKeno/Mini2/models");
const { KenoEast_one, KenoEast_phien } = require("../app/Controllers/game/MiniKeno/East/models");
const { KenoWest_one, KenoWest_phien } = require("../app/Controllers/game/MiniKeno/West/models");
const { KenoSouth_one, KenoSouth_phien } = require("../app/Controllers/game/MiniKeno/South/models");
const { KenoNorth_one, KenoNorth_phien } = require("../app/Controllers/game/MiniKeno/North/models");
const Config = require("../config/appConfigs");
const logger = require("../app/web/logger");
const { lowercaseFirstCharacter, errors, toFixed, useAuthenticate } = require("./util");

const gameTypeIds = Object.values(Config.gameIds);

const transformRequestToQuery = (params, otherParams) => ({
  phien: parseInt(params.gameRoundId),
  siteId: params.siteId,
  memberId: parseInt(params.obCustId),
  thanhtoan: true,
  ...otherParams,
});

const sendError = (error, res) => {
  res.send(error);
};

const getEndTime = (model) => async (params) => {
  const id = parseInt(params.gameRoundId);
  const phien = await model.findOne({ id }).lean().exec();

  if (!!phien) {
    return { endTime: phien.time || 0 };
  } else {
    throw errors.SB1001;
  }
};

const calculateData = async (model, query, reducer) => {
  const data = await model.find(query).lean().exec();

  if (data && data.length > 0) {
    const defaultResponse = {
      validBetAmount: 0,
      totalAmount: 0,
      totalWin: 0,
    };

    return data.reduce(reducer, defaultResponse);
  } else {
    throw errors.SB1001;
  }
};

const calculateKenoProVietData = async (model, query, reducer) => {
  const data = await model.find(query).lean().exec();

  if (data && data.length > 0) {
    const defaultResponse = {
      validBetAmount: 0,
      totalAmount: 0,
      totalWin: 0,
    };

    if (!data[0].thanhtoan) throw errors.SB1005;

    return data.reduce(reducer, defaultResponse);
  } else {
    throw errors.SB1001;
  }
};

const metadata = {
  [Config.gameIds.taixiu]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(TAIXIU, query, reducer);
      },
      getEndTime(TAIXIU_PHIEN),
    ],
  },
  [Config.gameIds.txturbo]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(TXTURBO, query, reducer);
      },
      getEndTime(TXTURBO_PHIEN),
    ],
  },
  [Config.gameIds.xocxoc]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["chan", "le", "red3", "red4", "white3", "white4"].reduce((result, key) => result + cuoc[key], 0);

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(XOCXOC, query, reducer);
      },
      getEndTime(XOCXOC_PHIEN),
    ],
  },
  [Config.gameIds.baucua]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += [...Array(6).keys()].reduce((result, key) => result + cuoc[key], 0);

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(BAUCUA, query, reducer);
      },
      getEndTime(BAUCUA_PHIEN),
    ],
  },
  [Config.gameIds.chanle]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(CHANLE, query, reducer);
      },
      getEndTime(CHANLE_PHIEN),
    ],
  },
  [Config.gameIds.clturbo]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(CHANLETURBO, query, reducer);
      },
      getEndTime(CHANLETURBO_PHIEN),
    ],
  },
  [Config.gameIds.minidragontiger]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["dragon", "tiger", "tie"].reduce((result, key) => result + cuoc[key], 0);

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(MINIDRAGONTIGER, query, reducer);
      },
      getEndTime(MINIDRAGONTIGER_PHIEN),
    ],
  },
  [Config.gameIds.kenopromax]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KENOPROMAX, query, reducer);
      },
      getEndTime(KENOPROMAX_PHIEN),
    ],
  },
  [Config.gameIds.minisedie]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, bet) => {
          result.validBetAmount += ["odd", "even", "red3", "red4", "white3", "white4"].reduce(
            (result, betChoice) => result + bet[betChoice],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += bet.betwin;

          return result;
        };

        return await calculateData(MINISEDIE, query, reducer);
      },
      getEndTime(MINISEDIE_PHIEN),
    ],
  },
  [Config.gameIds.baccarat]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["player", "banker", "tie", "big", "small", "playerPair", "bankerPair"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(BACCARAT, query, reducer);
      },
      getEndTime(BACCARAT_PHIEN),
    ],
  },
  [Config.gameIds.kenoproviet]: {
    handler: [
      async (params) => {
        const query = {
          phien: parseInt(params.gameRoundId),
          siteId: params.siteId,
          memberId: parseInt(params.obCustId),
        };

        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateKenoProVietData(KENOPROVIET, query, reducer);
      },
      getEndTime(KENOPROVIET_PHIEN),
    ],
  },
  [Config.gameIds.kenomax]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoMax_one, query, reducer);
      },
      getEndTime(KenoMax_phien),
    ],
  },
  [Config.gameIds.kenomax2]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoMax2_one, query, reducer);
      },
      getEndTime(KenoMax2_phien),
    ],
  },
  [Config.gameIds.kenomini]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoMini_one, query, reducer);
      },
      getEndTime(KenoMini_phien),
    ],
  },
  [Config.gameIds.kenomini2]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoMini2_one, query, reducer);
      },
      getEndTime(KenoMini2_phien),
    ],
  },
  [Config.gameIds.kenoeast]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoEast_one, query, reducer);
      },
      getEndTime(KenoEast_phien),
    ],
  },
  [Config.gameIds.kenowest]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoWest_one, query, reducer);
      },
      getEndTime(KenoWest_phien),
    ],
  },
  [Config.gameIds.kenosouth]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoSouth_one, query, reducer);
      },
      getEndTime(KenoSouth_phien),
    ],
  },
  [Config.gameIds.kenonorth]: {
    handler: [
      async (params) => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += ["big", "small", "odd", "even", "gold", "wood", "water", "fire", "earth"].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(KenoNorth_one, query, reducer);
      },
      getEndTime(KenoNorth_phien),
    ],
  },
};

const handleRequest = (params, res) => {
  const gameType = params.gameTypeId;
  const data = metadata[gameType];

  Promise.all(data.handler.map((func) => func(params)))
    .then((values) => values.reduce((result, data) => Object.assign(result, data), {}))
    .then((data) => {
      data.validBetAmount = toFixed(data.validBetAmount, 2);
      data.totalAmount = toFixed(data.totalAmount, 2);
      data.totalWin = toFixed(data.totalWin, 2);

      return data;
    })
    .then((data) => res.send(data))
    .catch((error) => {
      if (error.errorCode) {
        sendError(error, res);
      } else {
        logger.logError(error);
        sendError(errors.SB1000, res);
      }
    });
};

const validateParams = (req, res, next) => {
  const params = req.body;
  if (!params.gameRoundId) {
    sendError(errors.SB1002, res);
  } else if (!params.siteId) {
    sendError(errors.SB1003, res);
  } else if (!params.obCustId) {
    sendError(errors.SB1004, res);
  } else if (!gameTypeIds.includes(params.gameTypeId >> 0)) {
    sendError(errors.SB1006, res);
  } else {
    next();
  }
};

module.exports = function (app) {
  app.post(
    "/api/endgameinfo",
    useAuthenticate({
      logger: {
        error: logger.logError,
        warn: logger.logWarning,
      },
    }),
    lowercaseFirstCharacter,
    validateParams,
    (req, res) => handleRequest(req.body, res)
  );
};
