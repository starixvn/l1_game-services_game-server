const getTop = require("./getTop");
const getTopHQ = require("./getTopHQ");

module.exports = function (client, data) {
  if (!!data.getTop) {
    getTop(client);
  }

  if (!!data.getTopHQ) {
    getTopHQ(client, data.getTopHQ);
  }
};
