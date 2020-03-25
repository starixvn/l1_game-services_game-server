const BAUCUA = require("../app/Models/BauCua/BauCua_cuoc");
const BAUCUA_PHIEN = require("../app/Models/BauCua/BauCua_phien");
const XOCXOC = require("../app/Models/XocXoc/XocXoc_cuoc");
const XOCXOC_PHIEN = require("../app/Models/XocXoc/XocXoc_phien");
const TAIXIU = require("../app/Models/TaiXiu_one");
const TAIXIU_PHIEN = require("../app/Models/TaiXiu_phien");

const transformRequestToQuery = (params, otherParams) => ({
  phien: parseInt(params.gameRoundId),
  siteId: params.siteId,
  ...otherParams
});

const defaultResponse = {
  validBetAmount: 0,
  totalAmount: 0,
  totalWin: 0
};

const metadata = {
  1: {
    // Tai xiu
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
      async params => {
        const id = parseInt(params.gameRoundId);
        const phien = await TAIXIU_PHIEN.findOne({ id });

        return { endTime: phien.time || 0 };
      }
    ]
  },
  2: {
    // Xoc dia
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
      async params => {
        const id = parseInt(params.gameRoundId);
        const phien = await XOCXOC_PHIEN.findOne({ id });

        return { endTime: phien.time || 0 };
      }
    ]
  },
  3: {
    // Bau cua (Fish Prawn Crab)
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
      async params => {
        const id = parseInt(params.gameRoundId);
        const phien = await BAUCUA_PHIEN.findOne({ id });

        return { endTime: phien.time || 0 };
      }
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
    .then(data => res.send(data))
    .catch(error => {
      console.log(error);
      res.send({ error });
    });
};

module.exports = function(app) {
  app
    .get("/api/endgameinfo", (req, res) => handleRequest(req.query, res))
    .post("/api/endgameinfo", (req, res) => handleRequest(req.body, res));
};
