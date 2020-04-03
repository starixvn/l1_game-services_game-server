
var getBCHistory = require('../../../../../Controllers/game/baucua/getBCHistory');

module.exports = function (client, data) {
	if (!!data.id) {
		var red = !!data.red;
		var page = data.page >> 0;
		var kmess = 10;

		if (page > 0) {
			getBCHistory(data.id, red, page, kmess)
				.then(result => {
					client.red({ users: { baucua: result } });
				});
		}
	}
}
