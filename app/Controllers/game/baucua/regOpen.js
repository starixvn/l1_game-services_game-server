
var BauCua_phien = require('../../../Models/BauCua/BauCua_phien');
var BauCua_temp = require('../../../Models/BauCua/BauCua_temp');
let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

module.exports = function (client) {
	GameConfigs.findOne({ name: "baucua" }, function (err, data) {
		if (err) {
			console.log("error to get config for baucua");
		}

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

		var active1 = Promise.all(
			client.redT.baucua.ingame.map(function (user) {
				if (user.uid == client.UID) {
					if (user.red) {
						return Promise.all(dataMeRed.map(function (tab, i) {
							return (data[tab] = user[i]);
						}))
					} else {
						return Promise.all(dataMeXu.map(function (tab, i) {
							return (data[tab] = user[i]);
						}))
					}
				}
			}));

		// var active2 = new Promise((a, b) => {
		// 	BauCua_temp.findOne({}, {}, function (err, temp) {
		// 		Promise.all(dataMeRed.map(function (tab, i) {
		// 			return (LinhVat[i] = temp[i]);
		// 		}))
		// 			.then(Results => {
		// 				a(Results)
		// 			})
		// 	})
		// })

		var currentPhien = 0;
		var active3 = new Promise((resolve, reject) => {
			BauCua_phien.find({}, {}, { sort: { '_id': -1 }, limit: 10 }, function (err, post) {
				currentPhien = post[0].id + 1;
				var arrayOfResults = post.map(function (obj) {
					return [obj.dice1, obj.dice2, obj.dice3];
				});
				resolve(arrayOfResults);
			});
		});
		Promise.all([active1, active3])
			.then(result => {
				client.red({
					mini: {
						baucua: {
							regOpen: true, data: data, phien: currentPhien,
							logs: result[1],
							time_remain: client.redT.BauCua_time
						}
					}
				});
			});
	});
}
