
const GameConfigs = require('./../../Models/GameConfig/GameConfigs');
const logger = require('./../../web/logger');
module.exports = function (client) {
	GameConfigs.findOne({ name: "baucua" }, function (err, data) {
		if (err) {
			console.log("error to get config for baucua");
		}

		let disabled = (data == null || !data.enabled);
		if (disabled) {
			return;
		}
		try {
			client.red({
				mini: { baucua: { time_remain: client.redT.BauCua_time } }
			});
		} catch (ex) {
			logger.logError(ex);
		}
	});
	GameConfigs.findOne({ name: "taixiu" }, function (err, data) {
		if (err) {
			console.log("error to get config for taixiu");
		}

		let disabled = (data == null || !data.enabled);
		if (disabled) {
			return;
		}
		try {
			client.red({
				taixiu: { time_remain: client.redT.TaiXiu_time },
			});
		} catch (ex) {
			logger.logError(ex);
		}
	});
}
