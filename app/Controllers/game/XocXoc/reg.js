module.exports = function (client) {
	let xocxoc = client.redT.game.xocxoc;

	if (xocxoc.clients[client.UID]) {
		// Bạn hoặc ai đó đang chơi Xóc Xóc bằng tài khoản này
		client.red({ notice: { title: 'CẢNH BÁO', text: 'Bạn hoặc ai đó đang chơi Xóc Xóc bằng tài khoản này...', load: false } });
	} else {
		// Vào Phòng chơi
		xocxoc.clients[client.UID] = client;
		client.red({ toGame: 'XocXoc' });
	}
	xocxoc = null;
	client = null;
};
