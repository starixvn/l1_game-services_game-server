const logger = require('./../../../web/logger');
const ConfigHelper = require('./../../../Helpers/ConfigHelper');
const GameConfigs = require('../../../Models/GameConfig/GameConfigs');
const NoticeMessage = require('../constants/notice-messages');

const removeOldUser = (io, userId) => {
    let baccarat = io.game.baccarat;
    if (baccarat.realPlayers[userId]) {
        delete baccarat.realPlayers[userId];
        delete baccarat.players[userId];

        Object.values(baccarat.realPlayers).forEach((users) => {
            if (this !== users) {
                users.red({ baccarat: { outgame: { playerId: userId } } });
            }
        });
    }
}

const registerBaccarat = (client) => {
    const baccarat = client.redT.game.baccarat;

    removeOldUser(client.redT, client.UID);

    GameConfigs
        .findOne({ name: ConfigHelper.GameTypes.Baccarat })
        .then(data => {
            ConfigHelper.updateConfig(ConfigHelper.GameTypes.Baccarat, data);

            if (data != null && data.enabled) {
                if (baccarat.realPlayers[client.UID]) {
                    client.red({
                        notice: {
                            title: NoticeMessage.notice,
                            text: NoticeMessage.youOrOtherLoggedInToThisAccount(NoticeMessage.baccarat),
                            load: false
                        }
                    });
                } else {
                    baccarat.realPlayers[client.UID] = client;
                    client.red({ toGame: NoticeMessage.baccarat });
                }
            }
            else {
                client.red({
                    notice: {
                        title: NoticeMessage.notice,
                        text: data.disabled_message,
                        load: false,
                    }
                });
            }
        })
        .catch(error => logger.logError(error));
};

module.exports = {
    removeOldUser,
    registerBaccarat
};