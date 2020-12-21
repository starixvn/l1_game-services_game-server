const logger = require("./../app/web/logger");
const { lowercaseFirstCharacter, useAuthenticate } = require("./util");

const validateParams = (req, res, next) => {
  const params = req.body;

  if (!params.gameName || !params.pool || !params.winnerName || !params.amount) {
    logger.logCritical(`The jackpot winner information is invalid, details: ${JSON.stringify(params)}`);
  } else {
    next();
  }
};

const notifyJackpotWinner = (params, res, redT) => {
  if (params) {
    const payload = {
      jackpotWinner: params,
    };

    redT.sendAllUser(payload);
  }
};

module.exports = function (app, redT) {
  app.post(
    "/api/jackpotWinner",
    useAuthenticate({
      logger: {
        error: logger.logError,
        warn: logger.logWarning,
      },
    }),
    lowercaseFirstCharacter,
    validateParams,
    (req, res) => notifyJackpotWinner(req.body, res, redT)
  );
};
