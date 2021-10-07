const onPost = require("./onPost");

function auth(client) {
  client.gameEvent = {};
}

module.exports = {
  auth: auth,
  message: onPost,
};
