const XocXocPhien = require('../../../../Models/XocXoc/XocXoc_phien');
const logger = require('../../../../web/logger');

module.exports = function (client) {
	XocXocPhien.findOne({}, ['id', 'red1', 'red2', 'red3', 'red4'], { sort: { 'id': -1 } }, function (err, last) {
		if (err) {
			logger.logError(err);
		}

		try {
			if (last !== null) {
				client.red({
					xocxoc:
					{
						phien: last.id + 1,
						dices: [last.red1, last.red2, last.red3, last.red4],
						time_remain: client.redT.game.xocxoc.time
					}
				});
			}
		} catch (error) {
			logger.logError(error);
		}
	});
}
