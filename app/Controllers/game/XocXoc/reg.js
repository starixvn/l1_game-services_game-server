const logger = require('../../../web/logger');
const ConfigHelper = require('../../../Helpers/ConfigHelper');

module.exports = function (client) {

	let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

	let xocxoc = client.redT.game.xocxoc;

	GameConfigs.findOne({ name: ConfigHelper.GameTypes.XocXoc }, function (err, data) {
		if (err) {
			logger.logError(err);
		}

		try {
			ConfigHelper.updateConfig(ConfigHelper.GameTypes.XocXoc, data);

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
				var umMessage = "Game đang được bảo trì, vui lòng quay lại sau 10 phút.";

				if(!!data && !!data.disabled_message)
				{
					umMessage = data.disabled_message;
				}

				client.red({ notice: { title: 'Thông báo', text: umMessage, load: false } });
			}

		} catch (error) {
			logger.logError(error)
		}
	});


};
