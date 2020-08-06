let UserInfo = require("./app/Models/UserInfo");
let ConfigHelper = require("./app/Helpers/ConfigHelper");

var resetInRoom = function () {
  UserInfo.updateMany({ type: true, inGameRoom: ConfigHelper.GameTypes.Baccarat }, { inRoom: false }).catch((error) => {
    logger.logError(error);
  });

  UserInfo.updateMany({ type: true, inGameRoom: ConfigHelper.GameTypes.KenoProMax }, { inRoom: false }).catch((error) => {
    logger.logError(error);
  });
};

module.exports = {
  resetInRoom: resetInRoom,
};
