const GameNotifications = require("../Models/GameNotification");
const logger = require("../web/logger");

module.exports = async (client, { gameId }) => {
  try {
    const projection = {
      _id: false,
      __v: false,
      __archive: false,
    };
    const notifications = await GameNotifications.find({ uid: client.UID, gameId: gameId }, projection).lean().exec();

    client.red({ gameNotifications: notifications });
  } catch (err) {
    logger.logError(err);
  }
};
