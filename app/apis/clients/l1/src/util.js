const handleSuccess = (resolve, callback) => body => {
  callback && callback(null, body);
  resolve(body);
};

const handleError = (reject, callback) => error => {
  callback && callback(error);
  reject(error);
};

const uppercaseKeys = (obj) => Object.keys(obj).reduce((result, key) => {
  result[key[0].toUpperCase() + key.substr(1)] = obj[key];
  return result;
}, {})

module.exports = { handleSuccess, handleError, uppercaseKeys };