
const TXTurboPhien = require('../../../../Models/TXTurbo/TXTurbo_phien');
const logger = require('../../../../web/logger');

module.exports = function (client) {
    TXTurboPhien.findOne({}, 'id', { sort: { 'id': -1 } }, function (err, last) {
        if (err) {
            logger.logError(err);
        }

        try {
            if (last !== null) {
                client.red({ taixiu_turbo: { phien: last.id + 1, time_remain: client.redT.TXTurbo_time } });
            }
        } catch (error) {
            logger.logError(err);
        }
    })
}
