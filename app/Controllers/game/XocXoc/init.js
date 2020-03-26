
let fs = require('fs');

let GameConfigs = require('../../../Models/GameConfig/GameConfigs');

let XocXoc_phien = require('../../../Models/XocXoc/XocXoc_phien');
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let XocXoc_user = require('../../../Models/XocXoc/XocXoc_user');

let UserInfo = require('../../../Models/UserInfo');
let Helpers = require('../../../Helpers/Helpers');
let Config = require('../../../../config/xocxoc.json');
const balanceApi = require('../../../apis/balanceApi');
const ConfigHelper = require('../../../Helpers/ConfigHelper');
const gameIds = require('./../../../../config/appConfigs').gameIds;
let User = require('../../User');

//let botList = [];

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
		let self = this;

		if (this.time == 44) {
			GameConfigs.findOne({ name: "xocxoc" }, function (err, data) {
				if (err) {
					console.log("error to get config for xocxoc");
				}

				self.disabled = data == null || !data.enabled;

				if (self.disabled) {
					Object.values(self.clients).forEach(function (client) {
						client.red && client.red({ xocxoc: { um: true } });
					});

					GameConfigs.updateOne({ name: "xocxoc" }, { disabledround: self.phien }, function (err, data) {
						if (err) console.log("update game config error");
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

				fs.readFile('./data/xocxoc.json', 'utf8', (errjs, xocxocjs) => {
					try {
						xocxocjs = JSON.parse(xocxocjs);

						let red1 = xocxocjs.red1 == 2 ? !!((Math.random() * 2) >> 0) : xocxocjs.red1;
						let red2 = xocxocjs.red2 == 2 ? !!((Math.random() * 2) >> 0) : xocxocjs.red2;
						let red3 = xocxocjs.red3 == 2 ? !!((Math.random() * 2) >> 0) : xocxocjs.red3;
						let red4 = xocxocjs.red4 == 2 ? !!((Math.random() * 2) >> 0) : xocxocjs.red4;

						xocxocjs.red1 = 2;
						xocxocjs.red2 = 2;
						xocxocjs.red3 = 2;
						xocxocjs.red4 = 2;

						fs.writeFile('./data/xocxoc.json', JSON.stringify(xocxocjs), function (err) { });

						XocXoc_phien.create({ 'red1': red1, 'red2': red2, 'red3': red3, 'red4': red4, 'time': new Date() }, function (err, create) {
							if (!!create) {
								self.phien = create.id + 1;
								self.thanhtoan([red1, red2, red3, red4]);

								Object.values(self.clients).forEach(function (client) {
									client.red({ xocxoc: { finish: { dots: [red1, red2, red3, red4], round: create.id, winClients: self.winClients } } });
								});

								Object.values(self.io.admins).forEach(function (admin) {
									admin.forEach(function (client) {
										client.red({ xocxoc: { finish: { dots: [red1, red2, red3, red4], round: create.id } } });
									});
								});
								self.winClients = {};

								self.timeInterval = null;
								xocxocjs = null;
								self = null;

								ConfigHelper.loadConfigs("xocxoc");
							}
						});
					} catch (error) {
						console.log(error);
					}
				});

				fs.readFile('./config/xocxoc.json', 'utf8', (errXX, bcXX) => {
					try {
						bcXX = JSON.parse(bcXX);
						if (bcXX.bot) {
							// lấy danh sách tài khoản bot
							UserInfo.find({ type: true }, 'id name red', (err, blist) => {
								if (blist.length) {
									Promise.all(blist.map(function (buser) {
										buser = buser._doc;
										delete buser._id;

										return buser;
									}))
										.then(result => {
											let maxBot = (result.length * bcXX.maxBotPercentage) >> 0;
											this.changedTopBots = false;

											this.botList = Helpers.shuffle(result);
											this.botList = this.botList.slice(0, maxBot);
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
				});
			} else {
				this.thanhtoan();

				if (!!this.botList.length && this.time > 5) {
					let activeBots = Object.keys(this.tempBots);
					let random = (Math.random() * 5) >> 0;

					if (activeBots <= 20 || random == 3) { //bot in
						let length = (Math.random() * 5) >> 0;

						for (let i = 0; i < length; i++) {
							let dataT = this.botList[i];
							if (!!dataT) {
								this.tempBots[dataT.id] = dataT;
								this.tempBots[dataT.id].betCount = 0;
								if (!this.players[dataT.id]) {
									this.players[dataT.id] = dataT;
									Object.values(this.clients).forEach(function (user) {
										user.red({ xocxoc: { ingame: { player: { id: dataT.id, name: dataT.name, red: dataT.red } } } });
									});
								}
								this.botList.splice(i, 1);
							}
							dataT = null;
						}
					}
					if (activeBots.length > 20 && random == 4) { //bot out
						let length = (Math.random() * 5) >> 0;

						for (let i = 0; i < length; i++) {						
							let index = (Math.random() * activeBots.length >> 0);

							if(!this.changedTopBots && this.phien % this.modRoundToChangedTopBot == 0)
							{
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

					let userCuoc = (Math.random() * 10) >> 0;
					let tempBots = Object.values(this.tempBots).filter(function (t) { return t.betCount < 3 });
					for (let i = 0; i < userCuoc; i++) {
						let dataT = tempBots[i];
						if (!!dataT) {
							this.bot(dataT);
							this.tempBots[dataT.id].betCount += 1;
						}
						dataT = null;
					}
				}

			}
		}

	}.bind(this), 1000);
	return void 0;
}

XocXoc.prototype.thanhtoan = function (dice = null) {
	// thanh toán phiên
	let self = this;
	if (!!dice) {
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
			if (list.length) {
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
							let winRed = cuoc.red3 * 4 * 0.99;
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
							let winRed = cuoc.red4 * 16 * 0.99;
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
							let winRed = cuoc.white3 * 4 * 0.99;
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
							let winRed = cuoc.white4 * 16 * 0.99;
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
						balanceApi.endGame(cuoc.uid, gameInfo, update, self.clients, () => {
							XocXoc_user.updateOne({ uid: cuoc.uid }, { $inc: updateGame }, (err, xxser) => {
								resolve({ users: cuoc.name, bet: TienThang, red: cuoc.red });
							});
						});

						let status = {};
						if (TongThang > 0) {
							status = { win: true, bet: TongThang, thuong: thuong };
							status.boxs = boxs;
							self.winClients[cuoc.uid] = status;
						} else {
							status = { win: false, bet: TongThua };
						}

						if (void 0 !== self.clients[cuoc.uid]) {
							self.clients[cuoc.uid].red({ xocxoc: { status: status } });
						}

						if (status.win && void 0 !== self.io.users[cuoc.uid]) {
							self.io.users[cuoc.uid].forEach(function (client) {
								User.updateCoint(client);
							});
						}

						status = null;
						TongThua = null;
						TongThang = null;
						thuong = null;

						tongDat = null;
						update = null;
						updateGame = null;
					})
				}))
					.then(function (arrayOfResults) {
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
								return { users: obj.users, bet: obj.bet, game: 'Xóc Xóc' };
							}))
								.then(results => {
									self.io.sendInHome({ news: { a: results } });
									results = null;
									arrayOfResults = null;
									self = null;
								});
						} else {
							self = null;
						}
					});
			} else {
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
	} else {
		//self.ingame.client = Object.keys(self.clients).length + self.botCount;
		Object.values(this.clients).forEach(function (client) {
			client.red && client.red({ xocxoc: { client: self.data } });
		});

		///**
		let admin_data = { xocxoc: { info: this.dataAdmin, ingame: this.ingame } };
		Object.values(this.io.admins).forEach(function (admin) {
			admin.forEach(function (client) {
				if (client.gameEvent !== void 0 && client.gameEvent.viewXocXoc !== void 0 && client.gameEvent.viewXocXoc) {
					client.red(admin_data);
				}
			});
		});
		//*/
		self = null;
	}
}

XocXoc.prototype.resetData = function () {
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
		self.tempBots[id].betCount = 0;
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

let Boxs = {
	0: 'chan',
	1: 'le',
	2: 'red3',
	3: 'red4',
	4: 'white3',
	5: 'white4'
};

let Chips = {
	0: 1,
	1: 5,
	2: 10,
	3: 50,
	4: 100,
	5: 200
};

XocXoc.prototype.bot = function (bot) {
	let userChip = (Math.random() * 6) >> 0;
	let cuoc = Chips[userChip];
	let userCuoc = (Math.random() * 6) >> 0;
	let box = Boxs[userCuoc];

	let self = this;
	XocXoc_cuoc.findOne({ uid: bot.id, phien: this.phien, red: true }, function (err, checkOne) {
		if (checkOne) {
			if ((checkOne['chan'] + checkOne['le'] + checkOne['red3'] + checkOne['red4'] + checkOne['white3'] + checkOne['white4'] + cuoc) <= Config.maxBet) {
				checkOne[box] += cuoc;
				checkOne.save();
				self.data.red[box] += cuoc;

				Object.values(self.clients).forEach(function (client) {
					client.red({ xocxoc: { chip: { playerId: bot.id, box: box, cuoc: cuoc } } });
				});
			}

		} else {
			let create = { uid: bot.id, name: bot.name, phien: self.phien, red: true, time: new Date() };
			create[box] = cuoc;
			XocXoc_cuoc.create(create);
			self.data.red[box] += cuoc;

			Object.values(self.clients).forEach(function (client) {
				client.red({ xocxoc: { chip: { playerId: bot.id, box: box, cuoc: cuoc } } });
			});
		}

		bot = null;
		create = null;
		cuoc = null;
		userCuoc = null;
		box = null;
	});
}

module.exports = XocXoc;
