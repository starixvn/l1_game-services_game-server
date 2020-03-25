const BAUCUA = require("../app/Models/BauCua/BauCua_cuoc");
const BAUCUA_PHIEN = require("../app/Models/BauCua/BauCua_phien");
const XOCXOC = require("../app/Models/XocXoc/XocXoc_cuoc");
const XOCXOC_PHIEN = require("../app/Models/XocXoc/XocXoc_phien");
const TAIXIU = require("../app/Models/TaiXiu_one");
const TAIXIU_PHIEN = require("../app/Models/TaiXiu_phien");
const Config = require("../config/appConfigs");

const transformRequestToQuery = (params, otherParams) => ({
  phien: parseInt(params.gameRoundId),
  siteId: params.siteId,
  memberId: parseInt(params.obCustId),
  ...otherParams
});

const defaultResponse = {
  validBetAmount: 0,
  totalAmount: 0,
  totalWin: 0
};

const getEndTime = async (params, model) => {
  const id = parseInt(params.gameRoundId);
  const phien = await model.findOne({ id }).exec();

  return { endTime: phien.time || 0 };
};

const metadata = {
  [Config.gameIds.taixiu]: {
    model: TAIXIU_PHIEN,
    handler: [
      async params => {
        const query = transformRequestToQuery(params);
        const taixius = await TAIXIU.find(query).exec();

        return taixius.reduce(
          (result, cuoc) => {
            result.validBetAmount += cuoc.bet;
            result.totalAmount = result.validBetAmount;
            result.totalWin += cuoc.win ? cuoc.betwin + cuoc.bet : cuoc.tralai;

            return result;
          },
          { ...defaultResponse }
        );
      },
      getEndTime
    ]
  },
  [Config.gameIds.xocxoc]: {
    model: XOCXOC_PHIEN,
    handler: [
      async params => {
        const query = transformRequestToQuery(params, { thanhtoan: false });
        const cuocs = await XOCXOC.find(query).exec();

        return cuocs.reduce(
          (result, cuoc) => {
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
          },
          { ...defaultResponse }
        );
      },
      getEndTime
    ]
  },
  [Config.gameIds.baucua]: {
    model: BAUCUA_PHIEN,
    handler: [
      async params => {
        const query = transformRequestToQuery(params, { thanhtoan: false });
        const baucuas = await BAUCUA.find(query).exec();

        return baucuas.reduce(
          (result, cuoc) => {
            result.validBetAmount += [...Array(6).keys()].reduce(
              (result, key) => result + cuoc[key],
              0
            );

            result.totalAmount = result.validBetAmount;
            result.totalWin += cuoc.betwin;

            return result;
          },
          { ...defaultResponse }
        );
      },
      getEndTime
    ]
  }
};

const handleRequest = (params, res) => {
  const gameType = params.gameTypeId;
  const data = metadata[gameType];

  Promise.all(data.handler.map(func => func(params, data.model)))
    .then(values =>
      values.reduce((result, data) => Object.assign(result, data), {})
    )
    .then(data => res.send(data))
    .catch(error => {
      console.log(error);
      res.send({ error });
    });
};

const lowercaseFirstCharacter = (req, res, next) => {
  const newBody = Object.keys(req.body).reduce((result, key) => {
    const newKey = key[0].toLowerCase() + key.substr(1);
    result[newKey] = req.body[key];

    return result;
  }, {});

  req.body = newBody;
  next();
};

module.exports = function(app) {
  app.post("/api/endgameinfo", lowercaseFirstCharacter, (req, res) =>
    handleRequest(req.body, res)
  );
};
