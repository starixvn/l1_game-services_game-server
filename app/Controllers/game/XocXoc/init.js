let GameConfigs = require('../../../Models/GameConfig/GameConfigs');
let XocXoc_phien = require('../../../Models/XocXoc/XocXoc_phien');
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let XocXoc_user = require('../../../Models/XocXoc/XocXoc_user');
let UserInfo = require("../../../Models/UserInfo");
let constants = require('./constants');

const balanceApi = require('../../../apis/balanceApi');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const gameIds = require('./../../../../config/appConfigs').gameIds;
let User = require('../../User');
const logger = require('../../../web/logger');
let XDBot = require('./bot');

let XocXoc = function (io) {
	this.io = io;
	this.clients = {};
	this.players = {};
	this.time = 0;
	this.timeInterval = null;
	this.phien = 1;
	this.winClients = {};
	this.configs = null;
	this.XocXocPlayTime = 30;

	this.ingame = { red: {}, xu: {}, client: 0 };

	this.data = {
		'red': {
			'chan': 0,
			'le': 0,
			'red3': 0,
			'red4': 0,
			'white3': 0,
			'white4': 0,
		},
	};
	this.dataAdmin = {
		'red': {
			'chan': 0,
			'le': 0,
			'red3': 0,
			'red4': 0,
			'white3': 0,
			'white4': 0,
		},
	};

	let self = this;
	XocXoc_phien.findOne({}, 'id', { sort: { '_id': -1 } }, function (err, last) {
		if (!!last) {
			self.phien = last.id + 1;
		}
		self.play();
		self = null;
	});
}

XocXoc.prototype.play = function () {
	// chạy thời gian
	this.time = 39;
	this.disabled = false;

	this.timeInterval = setInterval(function () {
		try {

			let self = this;

			if (this.time == 39) {
				GameConfigs.findOne({ name: ConfigHelper.GameTypes.XocXoc }, function (err, data) {
					if (err) {
						logger.logError(err);
					}

					self.disabled = data == null || !data.enabled;
					var disabledMessage = data == null ? "" : data.disabled_message;

					ConfigHelper.updateConfig(ConfigHelper.GameTypes.XocXoc, data);

					if (self.disabled) {
						Object.values(self.clients).forEach(function (client) {
							client.red && client.red({ xocxoc: { um: true, um_message: disabledMessage } });
						});

						GameConfigs.updateOne({ name: ConfigHelper.GameTypes.XocXoc }, { disabledround: self.phien }, function (err, data) {
							if (err) logger.logError(err);
						});

						//reset time
						self.time = 39;
					}
				});
			}

			if (!self.disabled) {
				this.time--;
			}

			if (this.time == 34) {
				this.resetData();
				this.resetDataAdmin();
			}

			if (this.time < this.XocXocPlayTime) {
				if (this.time < 1) {
					clearInterval(this.timeInterval);
					this.time = 1;

					try {

						let red1 = (Math.random() * 2) >> 0;
						let red2 = (Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 3) <= 10;
						let red3 = (Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 3) % 2 == 0;
						let red4 = (Math.floor(Math.random() * 10000) + 1) % 2 != 0;

						XocXoc_phien.create({ 'red1': red1, 'red2': red2, 'red3': red3, 'red4': red4, 'time': new Date() }, function (err, create) {
							if (err) {
								logger.logError(err);
							}

							if (!!create) {
								self.phien = create.id + 1;
								self.thanhtoan([red1, red2, red3, red4], create.time);

								self.timeInterval = null;
								xocxocjs = null;
								self = null;

								configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.XocXoc);
							}
						});
					} catch (error) {
						logger.logError(error);
					}

					XDBot.resetBots(this.players, this.clients);

					// console.log("--------------XD finished round " + self.phien +" --------------");

				} else {
					XDBot.addBots(this.time, this.phien, this.clients, this.players, this.data);
					this.updateClientData();
				}
			}

		} catch (error) {
			logger.logError(error);
		}

	}.bind(this), 1000);
	return void 0;
}

XocXoc.prototype.thanhtoan = function (dice, settlementTime) {
	// thanh toán phiên
	let self = this;
	try {
		let gameChan = 0;     // Là chẵn

		dice.forEach(function (kqH) {
			if (kqH) {
				gameChan++;
			}
		});

		let red = gameChan;
		let white = 4 - gameChan;

		let red3 = (red == 3);   // 3 đỏ
		let red4 = (red == 4);   // 4 đỏ
		let white3 = (white == 3); // 3 trắng
		let white4 = (white == 4); // 4 trắng

		red = null;
		white = null;

		gameChan = !(gameChan % 2); // game là chẵn

		let phien = this.phien - 1;

		XocXoc_cuoc.find({ phien: phien }, {}, function (err, list) {
			if (err) {
				logger.logError(err);
			}

			if (list && list.length) {
				var odds = constants.odds;
				Promise.all(list.map(function (cuoc) {
					let tongDat = cuoc.chan + cuoc.le + cuoc.red3 + cuoc.red4 + cuoc.white3 + cuoc.white4;
					let TienThang = 0; // Số tiền thắng (chưa tính gốc)
					let TongThua = 0; // Số tiền thua
					let TongThang = 0; // Tổng tiền thắng (đã tính gốc)
					let thuong = 0;
					let boxs = {};

					// Cược Chẵn
					if (cuoc.chan > 0) {
						boxs["main"] = true;
						if (gameChan) {
							let winRed = cuoc.chan * odds.even;
							TongThang += winRed;
							TienThang += (winRed - cuoc.chan);

						} else {
							TongThua += cuoc.chan;
						}
					}
					// Cược Lẻ
					if (cuoc.le > 0) {
						boxs["main"] = true;
						if (!gameChan) {
							let winRed = cuoc.le * odds.odd;
							TongThang += winRed;
							TienThang += (winRed - cuoc.le);
						} else {
							TongThua += cuoc.le;
						}
					}
					// 3 đỏ
					if (cuoc.red3 > 0) {
						boxs["sub"] = true;
						if (red3) {
							let winRed = cuoc.red3 * odds.red3;
							TongThang += winRed;
							TienThang += (winRed - cuoc.red3);
						} else {
							TongThua += cuoc.red3;
						}
					}
					// 4 đỏ
					if (cuoc.red4 > 0) {
						boxs["sub"] = true;
						if (red4) {
							let winRed = cuoc.red4 * odds.red4;
							TongThang += winRed;
							TienThang += (winRed - cuoc.red4);
						} else {
							TongThua += cuoc.red4;
						}
					}
					// 3 trắng
					if (cuoc.white3 > 0) {
						boxs["sub"] = true;
						if (white3) {
							let winRed = cuoc.white3 * odds.white3;
							TongThang += winRed;
							TienThang += (winRed - cuoc.white3);
						} else {
							TongThua += cuoc.white3;
						}
					}
					// 4 trắng
					if (cuoc.white4 > 0) {
						boxs["sub"] = true;
						if (white4) {
							let winRed = cuoc.white4 * odds.white4;
							TongThang += winRed;
							TienThang += (winRed - cuoc.white4);
						} else {
							TongThua += cuoc.white4;
						}
					}

					let update = {};
					let updateGame = {};

					TongThang = parseFloat(TongThang.toFixed(2));
					TienThang = parseFloat(TienThang.toFixed(2));

					cuoc.thanhtoan = true;
					cuoc.betwin = TongThang;
					cuoc.save();

					if (TongThang > 0) {
						update['red'] = TongThang;
					}
					if (TienThang > 0) {
						update['redWin'] = updateGame['red'] = TienThang;
					}
					if (TongThua > 0) {
						update['redLost'] = updateGame['red_lost'] = TongThua;
					}

					update['redPlay'] = updateGame['redPlay'] = tongDat;

					let gameInfo = {
						gameId: gameIds.xocxoc,
						gameRoundId: phien,
						memberId: cuoc.memberId,
						siteId: cuoc.siteId,
						time: settlementTime
					}

					return new Promise((resolve) => {
						try {
							balanceApi.endGame(cuoc.uid, gameInfo, update, self.io.users, () => {
								XocXoc_user.updateOne({ uid: cuoc.uid }, { $inc: updateGame }, (err, xxser) => {
									resolve({ users: cuoc.name, bet: TienThang, red: cuoc.red });
								});
							});
						}
						catch (ex) {
							logger.logError(ex);
							resolve({ users: cuoc.name, bet: TienThang, red: cuoc.red });
						}

						let status = {};
						if (TongThang > 0) {
							status = { win: true, bet: TongThang, thuong: thuong };
							status.boxs = boxs;
							self.winClients[cuoc.uid] = status;

							if (self.players[cuoc.uid]) {
								self.players[cuoc.uid].red += TongThang;

								XDBot.updateBotBalance(cuoc.uid, self.players[cuoc.uid].red);
							}
						} else {
							status = { win: false, bet: TongThua };
						}

						if (void 0 !== self.clients[cuoc.uid]) {
							self.clients[cuoc.uid].red({ xocxoc: { status: status } });
						} else {
							if (status.win && void 0 !== self.io.users[cuoc.uid]) {
								self.io.users[cuoc.uid].forEach(function (client) {
									User.updateCoint(client);
								});
							}
						}

						status = null;
						TongThua = null;
						TongThang = null;
						thuong = null;

						tongDat = null;
						update = null;
						updateGame = null;
					})
				})).then(function (arrayOfResults) {
					Object.values(self.clients).forEach(function (client) {
						client.red({ xocxoc: { finish: { dots: dice, round: phien, winClients: self.winClients } } });
					});

					Object.values(self.io.admins).forEach(function (admin) {
						admin.forEach(function (client) {
							client.red({ xocxoc: { finish: { dots: dice, round: phien } } });
						});
					});
					self.winClients = {};
					phien = null;
					dice = null;
					red3 = null;
					red4 = null;
					white3 = null;
					white4 = null;
					self.play();

				}).catch(function (err) {
					logger.logError(err);
				});
			} else {
				Object.values(self.clients).forEach(function (client) {
					client.red({ xocxoc: { finish: { dots: dice, round: phien, winClients: self.winClients } } });
				});

				Object.values(self.io.admins).forEach(function (admin) {
					admin.forEach(function (client) {
						client.red({ xocxoc: { finish: { dots: dice, round: phien } } });
					});
				});
				self.winClients = {};
				phien = null;
				dice = null;
				red3 = null;
				red4 = null;
				white3 = null;
				white4 = null;

				self.play();
				self = null;
			}
		});
	} catch (error) {
		logger.logError(error);
	}
}

XocXoc.prototype.updateClientData = function () {
	try {
		Object.values(this.clients).forEach((client) => {
			client.red({ xocxoc: { client: this.data } });
		});

		let admin_data = { xocxoc: { info: this.dataAdmin, ingame: this.ingame } };
		Object.values(this.io.admins).forEach(function (admin) {
			admin.forEach(function (client) {
				if (client.gameEvent !== void 0 && client.gameEvent.viewXocXoc !== void 0 && client.gameEvent.viewXocXoc) {
					client.red(admin_data);
				}
			});
		});
	} catch (error) {
		logger.logError(error);
	}
}

XocXoc.prototype.resetData = function () {
	this.data.red.chan = 0;
	this.data.red.le = 0;
	this.data.red.red3 = 0;
	this.data.red.red4 = 0;
	this.data.red.white3 = 0;
	this.data.red.white4 = 0;
};

XocXoc.prototype.resetDataAdmin = function () {
	this.ingame.red = {};
	this.ingame.xu = {};

	this.dataAdmin.red.chan = 0;
	this.dataAdmin.red.le = 0;
	this.dataAdmin.red.red3 = 0;
	this.dataAdmin.red.red4 = 0;
	this.dataAdmin.red.white3 = 0;
	this.dataAdmin.red.white4 = 0;
};

module.exports = XocXoc;
