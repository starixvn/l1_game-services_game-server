
let fs = require('fs');

let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

let XocXoc_phien = require('../../../Models/XocXoc/XocXoc_phien');
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let XocXoc_user = require('../../../Models/XocXoc/XocXoc_user');

let UserInfo = require('../../../Models/UserInfo');
let Helpers = require('../../../Helpers/Helpers');
const balanceApi = require('../../../apis/balanceApi');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const gameIds = require('./../../../../config/appConfigs').gameIds;
let User = require('../../User');
const logger = require('../../../web/logger');

let XocXoc = function (io) {
	this.io = io;
	this.clients = {};
	this.players = {};
	this.time = 0;
	this.timeInterval = null;
	this.phien = 1;
	this.botList = [];
	this.tempBots = {};
	this.winClients = {};
	this.changedTopBots = false;
	this.modRoundToChangedTopBot = 6;
	this.configs = null;

	this.ingame = { red: {}, xu: {}, client: 0 };

	this.chip = {
		'chan': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0 },
		'le': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0 },
		'red3': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0 },
		'red4': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0 },
		'white3': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0 },
		'white4': { '1': 0, '5': 0, '10': 0, '50': 0, '100': 0, '200': 0 },
	};

	this.data = {
		'red': {
			'chan': 0,
			'le': 0,
			'red3': 0,
			'red4': 0,
			'white3': 0,
			'white4': 0,
		},
		'xu': {
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
		'xu': {
			'chan': 0,
			'le': 0,
			'red3': 0,
			'red4': 0,
			'white3': 0,
			'white4': 0,
		},
	};

	this.dataBot = {
		'chan': 0,
		'le': 0,
		'red3': 0,
		'red4': 0,
		'white3': 0,
		'white4': 0,
	}

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
	this.time = 44;
	this.disabled = false;

	this.timeInterval = setInterval(function () {
		try {

			let self = this;

			if (this.time == 44) {
				GameConfigs.findOne({ name: "xocxoc" }, function (err, data) {
					if (err) {
						logger.logError(err);
					}

					self.disabled = data == null || !data.enabled;

					ConfigHelper.updateConfig("xocxoc", data);

					if (self.disabled) {
						Object.values(self.clients).forEach(function (client) {
							client.red && client.red({ xocxoc: { um: true } });
						});

						GameConfigs.updateOne({ name: "xocxoc" }, { disabledround: self.phien }, function (err, data) {
							if (err) logger.logError(err);
						});

						//reset time
						self.time = 44;
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

			if (this.time < 30) {
				if (this.time < 0) {
					clearInterval(this.timeInterval);
					this.time = 0;

					try {

						let red1 = (Math.random() * 2) >> 0;
						let red2 = (Math.random() * 2) >> 0;
						let red3 = (Math.random() * 2) >> 0;
						let red4 = (Math.random() * 2) >> 0;

						XocXoc_phien.create({ 'red1': red1, 'red2': red2, 'red3': red3, 'red4': red4, 'time': new Date() }, function (err, create) {
							if (err) {
								logger.logError(err);
							}

							if (!!create) {
								self.phien = create.id + 1;
								self.thanhtoan([red1, red2, red3, red4]);

								self.timeInterval = null;
								xocxocjs = null;
								self = null;

								configs = ConfigHelper.getConfigs("xocxoc");
							}
						});
					} catch (error) {
						logger.logError(error);
					}

					try {
						if (configs.botenabled) {
							// lấy danh sách tài khoản bot
							UserInfo.find({ type: true }, 'id name red avatarId', (err, blist) => {
								if (err) {
									logger.logError(err);
								}

								if (blist.length) {
									Promise.all(blist.map(function (buser) {
										buser = buser._doc;
										delete buser._id;

										return buser;
									})).then(result => {
										let maxBot = Math.floor(result.length * ConfigHelper.getMaxBotForCurrentHour("xocxoc"));
										// console.log("XocXoc max bot " + maxBot);
										this.changedTopBots = false;

										this.botList = Helpers.shuffle(result);
										this.botList = this.botList.slice(0, maxBot);
									}).catch(function (err) {
										logger.logError(err);
									});
								}
							});

						} else {
							let activeBots = Object.keys(this.tempBots);

							activeBots.forEach(playerId => {
								delete this.tempBots[playerId];
								delete this.players[playerId];

								Object.values(this.clients).forEach(function (user) {
									user.red({ xocxoc: { outgame: { playerId: playerId } } });
								});
							});

							this.tempBots = [];
							this.botList = [];
						}
					} catch (error) {
						this.botList = [];
					}
				} else {
					this.updateClientData();

					if (!!this.botList.length && this.time > 5) {
						let activeBots = Object.keys(this.tempBots);
						let random = (Math.random() * 5) >> 0;

						if (activeBots <= 20 || random == 3) { //bot in
							let length = (Math.random() * 5) >> 0;

							for (let i = 0; i < length; i++) {
								let dataT = this.botList[i];
								if (!!dataT) {
									this.tempBots[dataT.id] = dataT;
									this.tempBots[dataT.id].totalBet = 0;
									if (!this.players[dataT.id]) {
										Object.values(this.clients).forEach(function (user) {
											user.red({ xocxoc: { ingame: { player: { id: dataT.id, name: dataT.name, red: dataT.red, avatarId: dataT.avatarId } } } });
										});
									}
									this.players[dataT.id] = dataT;
									this.botList.splice(i, 1);
								}
								dataT = null;
							}
						}
						if (activeBots.length > 20 && random == 4) { //bot out
							let length = (Math.random() * 5) >> 0;

							for (let i = 0; i < length; i++) {
								let index = (Math.random() * activeBots.length >> 0);

								if (!this.changedTopBots && this.phien % this.modRoundToChangedTopBot == 0) {
									// change top of bots
									index = Math.random() * 8 >> 0;
									this.changedTopBots = true
								}

								let playerId = activeBots[index];
								delete this.tempBots[playerId];
								delete this.players[playerId];
								Object.values(this.clients).forEach(function (user) {
									user.red({ xocxoc: { outgame: { playerId: playerId } } });
								});
							}
						}

						var maxBet = 10;
						if (!!configs && !!configs.bot_maxbet && !!configs.bot_maxbet > 0) {
							maxBet = configs.bot_maxbet;
						}

						let userCuoc = Math.floor(Math.random() * 15) + 5;

						let tempBots = Object.values(this.tempBots).filter(function (t) { return t.totalBet < maxBet });
						for (let i = 0; i < userCuoc; i++) {
							let dataT = tempBots[i];
							if (!!dataT) {
								this.bot(dataT, maxBet);
							}
							dataT = null;
						}
					}
				}
			}

		} catch (error) {
			logger.logError(error);
		}

	}.bind(this), 1000);
	return void 0;
}

XocXoc.prototype.thanhtoan = function (dice) {
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
							let winRed = cuoc.chan * 1.98;
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
							let winRed = cuoc.le * 1.98;
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
							let winRed = cuoc.red3 * 3.6;
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
							let winRed = cuoc.red4 * 14.4;
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
							let winRed = cuoc.white3 * 3.6;
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
							let winRed = cuoc.white4 * 14.4;
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
						siteId: cuoc.siteId
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
					arrayOfResults = arrayOfResults.filter(function (st) {
						return (st.red && st.bet > 0);
					});
					self.play();
					if (arrayOfResults.length) {
						arrayOfResults.sort(function (a, b) {
							return b.bet - a.bet;
						});

						arrayOfResults = arrayOfResults.slice(0, 3);
						arrayOfResults = Helpers.shuffle(arrayOfResults);

						Promise.all(arrayOfResults.map(function (obj) {
							return { users: obj.users, bet: obj.bet, game: 'Xóc Đĩa' };
						})).then(results => {
							self.io.sendInHome({ news: { a: results } });
							results = null;
							arrayOfResults = null;
							self = null;
						}).catch(function (err) {
							logger.logError(err);
						});
					} else {
						self = null;
					}
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
	this.dataBot.chan = 0;
	this.dataBot.le = 0;
	this.dataBot.red3 = 0;
	this.dataBot.red4 = 0;
	this.dataBot.white3 = 0;
	this.dataBot.white4 = 0;

	this.data.red.chan = 0;
	this.data.red.le = 0;
	this.data.red.red3 = 0;
	this.data.red.red4 = 0;
	this.data.red.white3 = 0;
	this.data.red.white4 = 0;

	this.data.xu.chan = 0;
	this.data.xu.le = 0;
	this.data.xu.red3 = 0;
	this.data.xu.red4 = 0;
	this.data.xu.white3 = 0;
	this.data.xu.white4 = 0;

	this.chip.chan['1'] = 0;
	this.chip.chan['5'] = 0;
	this.chip.chan['10'] = 0;
	this.chip.chan['200'] = 0;
	this.chip.chan['50'] = 0;
	this.chip.chan['100'] = 0;

	this.chip.le['1'] = 0;
	this.chip.le['5'] = 0;
	this.chip.le['10'] = 0;
	this.chip.le['50'] = 0;
	this.chip.le['100'] = 0;
	this.chip.le['200'] = 0;

	this.chip.red3['1'] = 0;
	this.chip.red3['5'] = 0;
	this.chip.red3['10'] = 0;
	this.chip.red3['50'] = 0;
	this.chip.red3['100'] = 0;
	this.chip.red3['200'] = 0;

	this.chip.red4['1'] = 0;
	this.chip.red4['5'] = 0;
	this.chip.red4['10'] = 0;
	this.chip.red4['50'] = 0;
	this.chip.red4['100'] = 0;
	this.chip.red4['200'] = 0;

	this.chip.white3['1'] = 0;
	this.chip.white3['5'] = 0;
	this.chip.white3['10'] = 0;
	this.chip.white3['50'] = 0;
	this.chip.white3['100'] = 0;
	this.chip.white3['200'] = 0;

	this.chip.white4['1'] = 0;
	this.chip.white4['5'] = 0;
	this.chip.white4['10'] = 0;
	this.chip.white4['50'] = 0;
	this.chip.white4['100'] = 0;
	this.chip.white4['200'] = 0;

	let self = this;
	Object.keys(this.tempBots).forEach(function (id) {
		self.tempBots[id].totalBet = 0;
	});
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

	this.dataAdmin.xu.chan = 0;
	this.dataAdmin.xu.le = 0;
	this.dataAdmin.xu.red3 = 0;
	this.dataAdmin.xu.red4 = 0;
	this.dataAdmin.xu.white3 = 0;
	this.dataAdmin.xu.white4 = 0;
};

let Boxs = { 0: 'chan', 1: 'le', 2: 'red3', 3: 'white3', 4: 'red4', 5: 'white4' };
let Chips = [200, 100, 50, 10, 5, 1];

XocXoc.prototype.bot = function (bot, maxBet) {
	let box;
	let totalBotBet = this.dataBot.chan + this.dataBot.le + this.dataBot.red3 + this.dataBot.red4 + this.dataBot.white3 + this.dataBot.white4;
	let totalBotBetMain = this.dataBot.chan + this.dataBot.le;

	let isMain = totalBotBet == 0 ? Math.floor(Math.random() * 2) : (totalBotBetMain * 100 / totalBotBet) < 80;
	let botBet = Chips[Math.floor(Math.random() * 6)];

	if (isMain) {
		let betChoice = Math.floor(Math.random() * 2);
		box = Boxs[betChoice];
	} else {
		let totalBetSubEvent = this.dataBot.red3 + this.dataBot.white3;
		let isEvent = totalBetSubEvent * 100 / totalBotBet < 15;
		let betChoice = isEvent ? (Math.floor(Math.random() * 2) + 2) : (Math.floor(Math.random() * 2) + 4);
		box = Boxs[betChoice];
	}

	let self = this;
	XocXoc_cuoc.findOne({ uid: bot.id, phien: this.phien, red: true }, function (err, checkOne) {
		if (err) {
			logger.logError(err);
		}

		try {
			if (!checkOne || (checkOne['chan'] + checkOne['le'] + checkOne['red3'] + checkOne['red4'] + checkOne['white3'] + checkOne['white4'] + botBet) <= maxBet) {
				UserInfo.findOne({ id: bot.id }, "red", function (err, user) {
					if (err) {
						logger.logError(err);
					}

					if (user && user.red > botBet) {
						user.red -= botBet;
						user.save();

						if (checkOne) {
							checkOne[box] += botBet;
							checkOne.save();
						} else {
							let create = { uid: bot.id, name: bot.name, phien: self.phien, red: true, time: new Date() };
							create[box] = botBet;
							XocXoc_cuoc.create(create);
						}

						self.data.red[box] += botBet;
						self.dataBot[box] += botBet;
						self.tempBots[bot.id].totalBet += botBet;


						if (self.players[bot.id]) {
							self.players[bot.id].red = user.red;
						}

						Object.values(self.clients).forEach(function (client) {
							client.red({ xocxoc: { chip: { playerId: bot.id, box: box, cuoc: botBet, red: user.red } } });
						});
					}
				});
			}
		}
		catch (err) {
			logger.logError(err);
		}
	});
}

module.exports = XocXoc;
