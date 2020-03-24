const BAUCUA = require("../app/Models/BauCua/BauCua_cuoc");
const XOCXOC = require("../app/Models/XocXoc/XocXoc_cuoc");

const transformRequestToQuery = (params, otherParams) => ({
  phien: parseInt(params.gameRoundId),
  siteId: params.siteId,
  thanhtoan: false,
  ...otherParams
});

const defaultResponse = {
  validBetAmount: 0,
  totalAmount: 0,
  totalWin: 0,
  endTime: new Date() // TODO
};

const metadata = {
  2: {
    // Xoc dia
    query: params => transformRequestToQuery(params),
    handler: cuocs =>
      cuocs.reduce(
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
      ),
    model: XOCXOC
  },
  3: {
    // Bau cua (Fish Prawn Crab)
    query: params => transformRequestToQuery(params),
    handler: cuocs =>
      cuocs.reduce(
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
      ),
    model: BAUCUA
  }
};

const handleRequest = (params, res) => {
  const gameType = params.gameTypeId;
  const data = metadata[gameType];
  console.log(data, data.query(params), params);
  data.model.find(data.query(params), (error, records) => {
    if (error) {
      res.send({ error });
      console.log(error);
    } else {
      const result = data.handler(records);
      res.send(result);
    }
  });
};

module.exports = function(app) {
  app
    .get("/api/endgameinfo", (req, res) => handleRequest(req.query, res))
    .post("/api/endgameinfo", (req, res) => handleRequest(req.body, res));
};
