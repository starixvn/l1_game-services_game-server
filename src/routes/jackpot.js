const logger = require("./../app/web/logger");
const { lowercaseFirstCharacter, useAuthenticate } = require("./util");
const GlobalConfig = require("./../app/Controllers/global-config");

const validateParams = (req, res, next) => {
  const params = req.body;

  if (!params.gameId || !params.pool || !params.winnerName || !params.amount) {
    logger.logCritical(`The jackpot winner information is invalid, details: ${JSON.stringify(params)}`);
    res.send({ error: true });
  } else {
    next();
  }
};

const notifyJackpotWinner = (params, res, redT) => {
  if (params) {
    const payload = {
      jackpotWinner: params,
    };

    const siteExclusions = GlobalConfig.getSiteExclusions(params.gameId);
    redT.sendAllUserExcept(payload, siteExclusions);

    res.send({ received: true });
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
