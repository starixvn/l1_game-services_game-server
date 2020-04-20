
const ChanLePhien = require('../../../../Models/ChanLe/ChanLe_phien');
const logger = require('../../../../web/logger');

module.exports = function (client) {
	ChanLePhien.findOne({}, 'id', { sort: { 'id': -1 } }, function (err, last) {
		console.log(client.redT.ChanLe_Time);
		if (err) {
			logger.logError(err);
		}

		try {
			if (last !== null) {
				client.red({ chanle: { phien: last.id + 1, time_remain: client.redT.ChanLe_time } });
			}
		} catch (error) {
			logger.logError(err);
		}
	})
}
