const Axios = require("axios").default;
const { url, clientId, clientKey } = require("../../config/appConfigs").gameResult;
const logger = require("../web/logger");

module.exports = (client, { language = "vi-VN" }) => {
  const data = {
    Auth: {
      ClientID: clientId,
      ClientKey: clientKey,
    },
    Language: language,
  };

  Axios.post(`${url}/GameRoundResult/GetAccessUrl`, data)
    .then((response) => {
      const { data } = response;
      client.red({ gameResult: { redirectUrl: data.redirectUrl } });
    })
    .catch(logger.logError);
};
