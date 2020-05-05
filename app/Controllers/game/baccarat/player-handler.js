const logger = require('./../../../web/logger');
const ConfigHelper = require('./../../../Helpers/ConfigHelper');

const removeOldUser = (io, userId) => {
    let baccarat = io.game.baccarat;
    if (baccarat.clients[userId]) {
        delete baccarat.clients[userId];
        delete baccarat.players[userId];

        Object.values(baccarat.clients).forEach((users) => {
            if (this !== users) {
                users.red({ baccarat: { outgame: { playerId: userId } } });
            }
        });
    }
}

const registerBaccarat = (client) => {

    removeOldUser(client.redT, client.UID);

    let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

    let baccarat = client.redT.game.baccarat;

    GameConfigs.findOne({ name: ConfigHelper.GameTypes.Baccarat }, function (err, data) {
        if (err) {
            logger.logError(err);

            return;
        }

        try {
            ConfigHelper.updateConfig(ConfigHelper.GameTypes.Baccarat, data);

            if (data != null && data.enabled) {
                if (baccarat.clients[client.UID]) {
                    client.red({ notice: { title: 'Thông báo', text: 'Bạn hoặc ai đó đang chơi Baccarat bằng tài khoản này.', load: false } });
                } else {
                    // Vào Phòng chơi
                    baccarat.clients[client.UID] = client;
                    client.red({ toGame: 'Baccarat' });
                }
                baccarat = null;
                client = null;
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

module.exports = {
    removeOldUser,
    registerBaccarat
};