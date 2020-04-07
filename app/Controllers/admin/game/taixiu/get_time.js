
const TXPhien = require('../../../../Models/TaiXiu_phien');
const logger = require('../../../../web/logger');

module.exports = function (client) {
	TXPhien.findOne({}, 'id', { sort: { 'id': -1 } }, function (err, last) {

		if (err) {
			logger.logError(err);
		}

		try {
			if (last !== null) {
				client.red({ taixiu: { phien: last.id + 1, time_remain: client.redT.TaiXiu_time } });
			}
		} catch (error) {
			logger.logError(err);
		}
	})
}
