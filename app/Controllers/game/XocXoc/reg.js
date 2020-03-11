var UserInfo = require("../../../Models/UserInfo");

module.exports = function (client) {
	let xocxoc = client.redT.game.xocxoc;

	if (xocxoc.clients[client.UID]) {
		// Bạn hoặc ai đó đang chơi Xóc Xóc bằng tài khoản này
		client.red({ notice: { title: 'CẢNH BÁO', text: 'Bạn hoặc ai đó đang chơi Xóc Xóc bằng tài khoản này...', load: false } });
	} else {
		// Vào Phòng chơi
		xocxoc.clients[client.UID] = client;
		let player = { id: client.UID, name: client.profile.name, red: 0 };

		// UserInfo.findOne({ id: client.UID }, 'red', function (err, user) {
		// 	player.red = user.red;
		// 	console.log(player);
		// });
		if (!xocxoc.players[player.id]) {
			xocxoc.players[player.id] = player;
		}
		client.red({ toGame: 'XocXoc' });
		Object.values(xocxoc.clients).forEach(function (users) {
			if (client !== users) {
				users.red({ xocxoc: { ingame: { player: player, client: Object.keys(xocxoc.clients).length + xocxoc.botCount } } });
			}
		});
	}
	xocxoc = null;
	client = null;
};
