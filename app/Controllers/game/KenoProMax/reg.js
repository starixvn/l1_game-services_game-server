const logger = require('../../../web/logger');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

module.exports = function (client) {
    let kenoProMax = client.redT.kenoProMax;

    GameConfigs.findOne({ name: ConfigHelper.GameTypes.KenoProMax }, function (err, data) {
        if (err) {
            logger.logError(err);
        }

        try {
            ConfigHelper.updateConfig(ConfigHelper.GameTypes.KenoProMax, data);

            if (data != null && data.enabled) {
                if (kenoProMax.clients[client.UID]) {
                    // Bạn hoặc ai đó đang chơi Xóc Xóc bằng tài khoản này
                    client.red({ notice: { title: 'Thông báo', text: 'Bạn hoặc ai đó đang chơi Keno Pro Max bằng tài khoản này.', load: false } });
                } else {
                    // Vào Phòng chơi
                    kenoProMax.clients[client.UID] = client;
                    client.red({ toGame: 'XocXoc' });
                }
                kenoProMax = null;
                kenoProMax = null;
            }
            else {
                var umMessage = "Game đang được bảo trì, vui lòng quay lại sau 10 phút.";

                if (!!data && !!data.disabled_message) {
                    umMessage = data.disabled_message;
                }

                client.red({ notice: { title: 'Thông báo', text: umMessage, load: false } });
            }

        } catch (error) {
            logger.logError(error)
        }
    });


};
