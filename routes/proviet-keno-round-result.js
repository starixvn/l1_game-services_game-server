const logger = require("../app/web/logger");
const { lowercaseFirstCharacter, errors, useAuthenticate } = require("./util");
const settleRound = require("../app/Controllers/game/MiniKeno/ProViet/settle-round");

const validateParams = (req, res, next) => {
  next();
};

const handleRequest = (params, res, redT) => {
  if (params) {
    const roundResult = {
      roundId: params.number,
      result: { ...params.result },
      settlementResult: { ...params.settlementResult },
      time: params.time,
    };

    settleRound(redT, roundResult);
  }

  res.send({
    received: true,
  });
};

module.exports = function (app, redT) {
  app.post(
    "/api/proviet-keno/round-result",
    useAuthenticate({
      logger: {
        error: logger.logError,
        warn: logger.logWarning,
      },
    }),
    lowercaseFirstCharacter,
    validateParams,
    (req, res) => handleRequest(req.body, res, redT)
  );
};
