
const ChanLeTurboPhien = require('../../../../Models/ChanLeTurbo/ChanLeTurbo_phien');
const logger = require('../../../../web/logger');

module.exports = function (client) {
	ChanLeTurboPhien.findOne({}, 'id', { sort: { 'id': -1 } }, function (err, last) {

		if (err) {
			logger.logError(err);
		}

		try {
			if (last !== null) {
				client.red({ clturbo: { phien: last.id + 1, time_remain: client.redT.ChanLeTurbo_time } });
			}
		} catch (error) {
			logger.logError(err);
		}
	})
}
