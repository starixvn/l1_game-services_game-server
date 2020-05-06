const ConfigHelper = require("../../../Helpers/ConfigHelper");
const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const Logger = require("../../../web/logger");

module.exports = function (client) {
  const kenoProMaxData = client.redT.kenoProMax;

  GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProMax })
    .exec()
    .then((config) => {
      ConfigHelper.updateConfig(ConfigHelper.GameTypes.KenoProMax, config);

      if (config && config.enabled) {
        if (kenoProMaxData.clients[client.UID]) {
          client.red({
            notice: {
              title: "Thông báo",
              text: "Bạn hoặc ai đó đang chơi Keno Pro Max bằng tài khoản này.",
              load: false,
            },
          });
        } else {
          kenoProMaxData.clients[client.UID] = client;
          client.red({ toGame: "KenoProMax" });
        }
      } else {
        let disabledMessage = config === null ? "" : config.disabled_message;

        client.red({
          notice: { title: "Thông báo", text: disabledMessage, load: false },
        });
      }
    })
    .catch((error) => Logger.logError(error));
};
