const logger = require('./../../../web/logger');
const ConfigHelper = require('./../../../Helpers/ConfigHelper');
const GameConfigs = require('../../../Models/GameConfig/GameConfigs');
const { notices } = require('./constants');

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
    const baccarat = client.redT.game.baccarat;

    removeOldUser(client.redT, client.UID);

    GameConfigs
        .findOne({ name: ConfigHelper.GameTypes.Baccarat })
        .then(data => {
            ConfigHelper.updateConfig(ConfigHelper.GameTypes.Baccarat, data);

            if (data != null && data.enabled) {
                if (baccarat.clients[client.UID]) {
                    client.red({ notice: { title: notices.title, text: notices.youOrOtherLoggedInToThisAccount, load: false } });
                } else {
                    baccarat.clients[client.UID] = client;
                    client.red({ toGame: 'Baccarat' });
                }
            }
            else {
                var umMessage = notices.umMessage;

                if (!!data && !!data.disabled_message) {
                    umMessage = data.disabled_message;
                }

                client.red({ notice: { title: notices.title, text: umMessage, load: false } });
            }
        })
        .catch(error => logger.logError(error));
};

module.exports = {
    removeOldUser,
    registerBaccarat
};