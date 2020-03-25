const { Issuer } = require("openid-client");
const { sendPostRequest } = require("./util");

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

module.exports = config => ({
  verifyToken: sendPostRequest("/AuthVerification/verify", config),
  singleSignOn: sendPostRequest("/signin/index", config),
  getBearerToken: getBearerToken(config)
});
