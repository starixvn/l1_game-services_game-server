const logger = require('./../../../web/logger');

module.exports = function (client) {
    try {
        let kenoProMax = client.redT.kenoProMax;
        if (kenoProMax.clients[client.UID] === client) {
            delete kenoProMax.clients[client.UID];
            delete kenoProMax.players[client.UID];

            Object.values(kenoProMax.clients).forEach(function (users) {
                if (client !== users) {
                    users.red({ kenoProMax: { outgame: { playerId: client.UID } } });
                }
            });
        }
        kenoProMax = null;
        client = null;
    } catch (error) {
        logger.logError(error);
    }
};
