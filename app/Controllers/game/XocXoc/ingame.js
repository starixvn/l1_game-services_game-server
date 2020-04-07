
let XocXoc_phien = require('../../../Models/XocXoc/XocXoc_phien');
let XocXoc_chat = require('../../../Models/XocXoc/XocXoc_chat');
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let UserInfo = require('../../../Models/UserInfo');
const logger = require('../../../web/logger');

module.exports = function (client) {
	let xocxoc = client.redT.game.xocxoc;
	if (xocxoc.clients[client.UID] === client) {
		let phien = xocxoc.phien;
		// Lấy thông tin phòng
		let data = {};
		data.time = xocxoc.time;
		data.data = xocxoc.data;
		data.chip = xocxoc.chip;

		var active1 = new Promise((resolve, reject) => {
			XocXoc_phien.find({}, 'id red1 red2 red3 red4', { sort: { '_id': -1 }, limit: 48 }, function (err, logs) {
				if (err) {
					logger.logError(err);
				}

				if (logs) {
					Promise.all(logs.map(function (log) {
						return { round: log.id, dots: [log.red1, log.red2, log.red3, log.red4] };
					})).then(function (result) {
						resolve(result);
					}).catch(function (err) {
						logger.logError(err);
					});
				}
			});
		});

		var active2 = new Promise((resolve, reject) => {
			XocXoc_chat.find({}, 'name value', { sort: { '_id': -1 }, limit: 20 }, function (err, chats) {
				if (err) {
					logger.logError(err);
				}

				if (chats) {
					Promise.all(chats.map(function (chat) {
						chat = chat._doc;
						delete chat._id;
						return chat;
					})).then(function (result) {
						resolve(result);
					}).catch(function (err) {
						logger.logError(err);
					})
				}
			});
		});

		var active3 = new Promise((resolve, reject) => {
			XocXoc_cuoc.find({ phien: phien }, 'bet type', { sort: { '_id': -1 } }, function (err, phiens) {
				if (err) {
					logger.logError(err);
				}

				if (phiens) {
					Promise.all(phiens.map(function (phien) {
						phien = phien._doc;
						delete phien._id;
						return phien;
					})).then(function (result) {
						resolve(result);
					}).catch(function (err) {
						logger.logError(err);
					});
				}
			});
		});

		var active4 = new Promise((resolve, reject) => {
			UserInfo.findOne({ id: client.UID }, 'red avatarId', function (err, user) {
				if (err) {
					logger.logError(err);
				}

				Promise.all([user]).then(function (result) {
					resolve(result);
				}).catch(function (err) {
					logger.logError(err);
				});
			});
		})

		Promise.all([active1, active2, active3, active4]).then(values => {
			data.logs = values[0];
			data.chats = values[1];
			data.cuoc = values[2];
			data.me = {};
			if (xocxoc.ingame.red[client.profile.name]) {
				data.me.red = xocxoc.ingame.red[client.profile.name]
			}
			if (xocxoc.ingame.xu[client.profile.name]) {
				data.me.xu = xocxoc.ingame.xu[client.profile.name]
			}
			let user = values[3][0];
			let player = { id: client.UID, name: client.profile.name, red: user.red, avatarId: user.avatarId };
			data.players = { ...xocxoc.players };
			delete data.players[client.UID];

			if (!xocxoc.players[player.id]) {
				xocxoc.players[player.id] = player;
			}

			client.red({ xocxoc: { ingame: data } });

			Object.values(xocxoc.clients).forEach(function (users) {
				if (client !== users) {
					users.red({ xocxoc: { ingame: { player: player } } });
				}
			});

			values = null;
			data = null;
			client = null;
			xocxoc = null;
		}).catch(function (err) {
			logger.logError(err);
		});
	} else {
		// trở lại màn hình trang chủ
		client.red({ toGame: 'MainGame' });
		client = null;
		xocxoc = null;
	}
};
