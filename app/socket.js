
let first = require('./Controllers/User.js').first;
let onPost = require('./Controllers/onPost.js');

let auth = function (client) {
	client.gameEvent = {};
	client.scene = 'home';
	first(client);
	client = null;
}

let signMethod = function (client) {
	client.TTClear = function () {
		if (!!this.caothap) {
			clearTimeout(this.caothap.time);
			this.caothap.time = null;
			this.caothap = null;
		}

		if (this.redT) {
			let xocxoc = this.redT.game.xocxoc;
			if (xocxoc.clients[this.UID] === this) {
				delete xocxoc.clients[this.UID];
				delete xocxoc.players[this.UID];

				Object.values(xocxoc.clients).forEach((users) => {
					if (this !== users) {
						users.red({ xocxoc: { outgame: { playerId: this.UID } } });
					}
				});
			}

			let kenoProMax = this.redT.kenoProMax;
			if (kenoProMax.realPlayers[this.UID]) {
				delete kenoProMax.realPlayers[this.UID];
				delete kenoProMax.players[this.UID];

				Object.values(kenoProMax.realPlayers).forEach((user) => {
					if (this !== user) {
						user.red({ kenoProMax: { outgame: { playerId: this.UID } } });
					}
				});
			}

			xocxoc = null;
			kenoProMax = null;
			delete this.redT;
		}

		this.TTClear = null;
	}
	client = null;
}

module.exports = {
	auth: auth,
	message: onPost,
	signMethod: signMethod,
};
