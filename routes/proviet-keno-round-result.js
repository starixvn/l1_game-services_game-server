const logger = require("../app/web/logger");
const { lowercaseFirstCharacter, errors, useAuthenticate } = require("./util");
const getRounds = require("../app/Controllers/Game/MiniKeno/ProViet/get-rounds");
const validateParams = (req, res, next) => {
  next();
};

const handleRequest = (params, res) => {
    getRounds();
};

module.exports = function (app) {
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
    (req, res) => handleRequest(req.body, res)
  );
};
