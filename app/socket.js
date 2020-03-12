
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

		//if (!!this.poker) {
		//	this.poker.outGame();
		//this.poker = null;
		//}


		if (this.redT) {
			let xocxoc = this.redT.game.xocxoc;
			if (xocxoc.clients[this.UID] === this) {
				delete xocxoc.clients[this.UID];
				delete xocxoc.players[this.UID]

				Object.values(xocxoc.clients).forEach(function (users) {
					if (client !== users) {
						users.red && users.red({ xocxoc: { outgame: { palyerId: this.UID } } });
					}
				});
			}
			xocxoc = null;
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
