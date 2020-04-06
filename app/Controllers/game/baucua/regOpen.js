
var BauCua_phien = require('../../../Models/BauCua/BauCua_phien');
let GameConfigs = require('../../../Models/GameConfig/GameConfigs');
const logger = require('../../../web/logger');

module.exports = function (client) {
	GameConfigs.findOne({ name: "baucua" }, function (err, data) {
		if (err) {
			console.log("error to get config for baucua");
		}
		try {
			var disabled = (data == null || !data.enabled);

			if (disabled) {
				return;
			}
			var data = JSON.parse(JSON.stringify(client.redT.baucua.info));;

			var dataMeXu = [
				'meXuHuou',
				'meXuBau',
				'meXuGa',
				'meXuCa',
				'meXuCua',
				'meXuTom',
			];
			var dataMeRed = [
				'meRedHuou',
				'meRedBau',
				'meRedGa',
				'meRedCa',
				'meRedCua',
				'meRedTom',
			];

			client.redT.baucua.ingame.forEach(function (user) {
				if (user.uid == client.UID) {
					if (user.red) {
						dataMeRed.forEach(function (tab, i) {
							data[tab] = user[i];
						});
					} else {
						dataMeXu.forEach(function (tab, i) {
							data[tab] = user[i];
						});
					}
				}
			});

			var currentPhien = 0;
			BauCua_phien.find({}, {}, { sort: { '_id': -1 }, limit: 10 }, function (err, post) {
				if (err) {
					logger.logError(err);
					return;
				}
				try {
					currentPhien = post[0].id + 1;
					var result = post.map(function (obj) {
						return [obj.dice1, obj.dice2, obj.dice3];
					});

					client.red({
						mini: {
							baucua: {
								regOpen: true, data: data, phien: currentPhien,
								logs: result,
								time_remain: client.redT.BauCua_time
							}
						}
					});
				} catch (ex) {
					logger.logError(ex);
				}
			});
		} catch (ex) {
			logger.logError(ex);
		}
	});
}
