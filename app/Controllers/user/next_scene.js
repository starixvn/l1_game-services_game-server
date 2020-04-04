
module.exports = function (client) {
	GameConfigs.findOne({ name: "baucua" }, function (err, data) {
		if (err) {
			console.log("error to get config for baucua");
		}

		let disabled = (data == null || !data.enabled);
		if (disabled) {
			return;
		}
		client.red({
			mini: { baucua: { time_remain: client.redT.BauCua_time } }
		});
	});
	GameConfigs.findOne({ name: "taixiu" }, function (err, data) {
		if (err) {
			console.log("error to get config for taixiu");
		}

		let disabled = (data == null || !data.enabled);
		if (disabled) {
			return;
		}
		client.red({
			taixiu: { time_remain: client.redT.TaiXiu_time },
		});
	});
}
