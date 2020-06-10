const logger = require("../app/web/logger");
const { lowercaseFirstCharacter, errors, toFixed, useAuthenticate } = require("./util");

const validateParams = (req, res, next) => {
  next();
};

const handleRequest = (params, res) => {
    debugger;
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
