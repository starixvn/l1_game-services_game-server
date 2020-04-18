
module.exports = function (client) {
	let GameConfigs = require('../Models/GameConfig/GameConfigs');
	const logger = require('../web/logger');

	GameConfigs.findOne({ name: "taixiu" }).then(function (data) {
		try {
			var isEnabled = (!!data && data.enabled);

			if (isEnabled) {
				client.red({ taixiu: { time_remain: client.redT.TaiXiu_time } });
			} else {
				client.red({ taixiu: { um: true } });
			}
		} catch (err) {
			logger.logError(err);
		}
	}).catch(function (err) {
		logger.logError(err);
	});

	GameConfigs.findOne({ name: "txturbo" }).then(function (data) {
		try {
			var isEnabled = (!!data && data.enabled);

			if (isEnabled) {
				client.red({ taixiu_turbo: { time_remain: client.redT.TXTurbo_time } });
			} else {
				client.red({ taixiu_turbo: { um: true } });
			}
		} catch (err) {
			logger.logError(err);
		}

	}).catch(function (err) {
		logger.logError(err);
	});

	GameConfigs.findOne({ name: "baucua" }).then(function (data) {
		try {
			var isEnabled = (!!data && data.enabled);

			if (isEnabled) {
				client.red({ mini: { baucua: { time_remain: client.redT.BauCua_time } } });
			} else {
				client.red({ mini: { baucua: { um: true } } });
			}
		}
		catch (err) {
			logger.logError(err);
		}
	}).catch(function (err) {
		logger.logError(err);
	});
}
