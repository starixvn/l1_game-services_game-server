let User = require("./User");
let message = require("./Message");
const GameResult = require("./game-result");
const GameNotification = require("./game-notification");

module.exports = function (client, p) {
  if (!!p) {
    if (!!p.user) {
      User.onData(client, p.user);
    }

    if (!!p.gameResult) {
      GameResult(client, p.gameResult);
    }

    if (!!p.scene && typeof p.scene === "string") {
      client.scene = p.scene;
      User.next_scene(client);
    }

    if (!!p.message) {
      message(client, p.message);
    }

    if (!!p.gameNotifications) {
      GameNotification(client, p.gameNotifications);
    }
  }
};
