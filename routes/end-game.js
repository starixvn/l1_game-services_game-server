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
const Config = require("../config/appConfigs");
const logger = require("../app/web/logger");
const { lowercaseFirstCharacter, errors, toFixed } = require("./util");

const transformRequestToQuery = (params, otherParams) => ({
  phien: parseInt(params.gameRoundId),
  siteId: params.siteId,
  memberId: parseInt(params.obCustId),
  ...otherParams
});

const sendError = (error, res) => {
  res.send(error);
};

const getEndTime = model => async (params) => {
  const id = parseInt(params.gameRoundId);
  const phien = await model.findOne({ id }).exec();

  if (!!phien) {
    return { endTime: phien.time || 0 };
  } else {
    throw errors.SB1001;
  }
};

const calculateData = async (model, query, reducer) => {
  const data = await model.find(query).exec();

  if (data && data.length > 0) {
    const defaultResponse = {
      validBetAmount: 0,
      totalAmount: 0,
      totalWin: 0
    };

    return data.reduce(reducer, defaultResponse);
  } else {
    throw errors.SB1001;
  }
};

const metadata = {
  [Config.gameIds.taixiu]: {
    handler: [
      async params => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(TAIXIU, query, reducer);
      },
      getEndTime(TAIXIU_PHIEN)
    ]
  },
  [Config.gameIds.txturbo]: {
    handler: [
      async params => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(TXTURBO, query, reducer);
      },
      getEndTime(TXTURBO_PHIEN)
    ]
  },
  [Config.gameIds.xocxoc]: {
    handler: [
      async params => {
        const query = transformRequestToQuery(params, { thanhtoan: true });
        const reducer = (result, cuoc) => {
          result.validBetAmount += [
            "chan",
            "le",
            "red3",
            "red4",
            "white3",
            "white4"
          ].reduce((result, key) => result + cuoc[key], 0);

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(XOCXOC, query, reducer);
      },
      getEndTime(XOCXOC_PHIEN)
    ]
  },
  [Config.gameIds.baucua]: {
    handler: [
      async params => {
        const query = transformRequestToQuery(params, { thanhtoan: true });
        const reducer = (result, cuoc) => {
          result.validBetAmount += [...Array(6).keys()].reduce(
            (result, key) => result + cuoc[key],
            0
          );

          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.betwin;

          return result;
        };

        return await calculateData(BAUCUA, query, reducer);
      },
      getEndTime(BAUCUA_PHIEN)
    ]
  },
  [Config.gameIds.chanle]: {
    handler: [
      async params => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(CHANLE, query, reducer);
      },
      getEndTime(CHANLE_PHIEN)
    ]
  },
  [Config.gameIds.clturbo]: {
    handler: [
      async params => {
        const query = transformRequestToQuery(params);
        const reducer = (result, cuoc) => {
          result.validBetAmount += cuoc.bet;
          result.totalAmount = result.validBetAmount;
          result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

          return result;
        };

        return await calculateData(CHANLETURBO, query, reducer);
      },
      getEndTime(CHANLETURBO_PHIEN)
    ]
  }
};

const handleRequest = (params, res) => {
  const gameType = params.gameTypeId;
  const data = metadata[gameType];

  Promise.all(data.handler.map(func => func(params)))
    .then(values =>
      values.reduce((result, data) => Object.assign(result, data), {})
    )
    .then(data => {
      data.validBetAmount = toFixed(data.validBetAmount, 2);
      data.totalAmount = toFixed(data.totalAmount, 2);
      data.totalWin = toFixed(data.totalWin, 2);

      return data;
    })
    .then(data => res.send(data))
    .catch(error => {
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
  } else {
    next();
  }
};

module.exports = function (app) {
  app.post(
    "/api/endgameinfo",
    lowercaseFirstCharacter,
    validateParams,
    (req, res) => handleRequest(req.body, res)
  );
};
