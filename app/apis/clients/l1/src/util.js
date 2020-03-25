const Axios = require("axios").default;

const handleSuccess = (resolve, callback) => body => {
  callback && callback(null, body);
  resolve(body);
};

const handleError = (reject, callback) => error => {
  callback && callback(error);
  reject(error);
};

const uppercaseKeys = obj =>
  Object.keys(obj).reduce((result, key) => {
    result[key[0].toUpperCase() + key.substr(1)] = obj[key];
    return result;
  }, {});

const sendPostRequest = (action, { apiUrl, token }) => (params, callback) =>
  new Promise((resolve, reject) => {
    const languageCode = params.languageCode || null;
    const config = token
      ? {
          headers: { Authorization: token, LanguageCode: languageCode }
        }
      : undefined;

    Axios.post(`${apiUrl}${action}`, params, config)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

module.exports = { handleSuccess, handleError, uppercaseKeys, sendPostRequest };
