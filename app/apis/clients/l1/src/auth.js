const Axios = require("axios").default;
const { Issuer } = require("openid-client");
const { handleError, handleSuccess, sendPostRequest } = require("./util");

const getBearerToken = ({ authUrl, client }) => async callback => {
  const data = {
    grant_type: "client_credentials",
    client_id: client.id,
    client_secret: client.secret
  };

  return await Issuer.discover(authUrl)
    .then(issuer => new issuer.Client(data))
    .then(client => client.grant(data))
    .then(token =>
      token.access_token
        ? `${token.token_type} ${token.access_token}`
        : Promise.reject(token)
    )
    .then(token => {
      callback && callback(null, token);
      return token;
    })
    .catch(error => {
      callback && callback(error);
      return Promise.reject(error);
    });
};

const singleSignOn = ({ apiUrl, authUrl, client }) => (params, callback) =>
  new Promise((resolve, reject) => {
    const url = `${apiUrl}/signin/index`;

    getBearerToken({ authUrl, client })()
      .then(token =>
        Axios.post(url, params, { headers: { Authorization: token } })
      )
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

module.exports = config => ({
  verifyToken: sendPostRequest("/AuthVerification/verify", config),
  singleSignOn: singleSignOn(config),
  getBearerToken: getBearerToken(config)
});
