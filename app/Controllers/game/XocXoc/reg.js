const logger = require('../../../web/logger');

module.exports = function (client) {

	let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

	let xocxoc = client.redT.game.xocxoc;

	GameConfigs.findOne({ name: "xocxoc" }, function (err, data) {
		if (err) {
			logger.logError(err);
		}

		if (data != null && data.enabled) {
			if (xocxoc.clients[client.UID]) {
				// Bạn hoặc ai đó đang chơi Xóc Xóc bằng tài khoản này
				client.red({ notice: { title: 'Thông báo', text: 'Bạn hoặc ai đó đang chơi Xóc Đĩa bằng tài khoản này.', load: false } });
			} else {
				// Vào Phòng chơi
				xocxoc.clients[client.UID] = client;
				client.red({ toGame: 'XocXoc' });
			}
			xocxoc = null;
			client = null;
		}
		else {
			client.red({ notice: { title: 'Thông báo', text: 'Hệ thống đang bảo trì. Vui lòng quay lại sau...', load: false } });
		}
	});


};
