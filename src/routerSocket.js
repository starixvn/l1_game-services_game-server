let users = require("./socketUsers");

// Router Websocket
module.exports = function (app, redT) {
  app.ws("/websocket", function (ws, req) {
    users(ws, redT, req);
  });
};
