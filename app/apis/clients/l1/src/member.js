const Axios = require("axios").default;
const { handleError, handleSuccess } = require("./util");

const notifyLogin = ({ apiUrl }) => (params, callback) =>
  new Promise((resolve, reject) => {
    Axios.post(`${apiUrl}/Member/EnterPortal`, params)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

const balance = ({ apiUrl }) => (params, callback) =>
  new Promise((resolve, reject) => {
    Axios.post(`${apiUrl}/Member/Balance`, params)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

const placeBet = ({ apiUrl }) => (params, callback) =>
  new Promise((resolve, reject) => {
    Axios.post(`${apiUrl}/Member/PlaceBet`, params)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

const endGame = ({ apiUrl }) => (params, callback) =>
  new Promise((resolve, reject) => {
    Axios.post(`${apiUrl}/Member/EndGame`, params)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

const voidGame = ({ apiUrl }) => (params, callback) =>
  new Promise((resolve, reject) => {
    Axios.post(`${apiUrl}/Member/VoidGame`, params)
      .then(data => data.data)
      .then(handleSuccess(resolve, callback))
      .catch(handleError(reject, callback));
  });

module.exports = config => ({
  notifyLogin: notifyLogin(config),
  balance: balance(config),
  placeBet: placeBet(config),
  endGame: endGame(config),
  voidGame: voidGame(config)
});
