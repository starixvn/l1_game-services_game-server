const Axios = require("axios").default;
const { Issuer } = require("openid-client");
const { handleError, handleSuccess } = require("./util");

const verifyToken = ({ apiUrl }) => (params, callback) =>
  new Promise((resolve, reject) => {
    Axios.post(`${apiUrl}/AuthVerification/verify`, params)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

const singleSignOn = ({ apiUrl, authUrl, client }) => (
  params,
  callback
) =>
  new Promise((resolve, reject) => {
    const metadata = {
      grant_type: "client_credentials",
      client_id: client.id,
      client_secret: client.secret,
      site_id: params.siteId
    };

    const url = `${apiUrl}/signin/index`;

    Issuer.discover(authUrl)
      .then(issuer => new issuer.Client(metadata))
      .then(client => client.grant(metadata))
      .then(
        token =>
          token.access_token
            ? `${token.token_type} ${token.access_token}`
            : Promise.reject(token)
      )
      .then(token =>
        Axios.post(url, params, { headers: { Authorization: token } })
      )
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

module.exports = config => ({
  verifyToken: verifyToken(config),
  singleSignOn: singleSignOn(config)
});
