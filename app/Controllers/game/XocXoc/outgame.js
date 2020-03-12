
module.exports = function (client) {
	let xocxoc = client.redT.game.xocxoc;
	if (xocxoc.clients[client.UID] === client) {
		delete xocxoc.clients[client.UID];
		delete xocxoc.players[client.UID];

		Object.values(xocxoc.clients).forEach(function (users) {
			if (client !== users) {
				users.red({ xocxoc: { outgame: { playerId: client.UID } } });
			}
		});
	}
	xocxoc = null;
	client = null;
};
