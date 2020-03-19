let path = require('path');
let fs = require('fs');

let Helpers = require('../Helpers/Helpers');

let UserInfo = require('../Models/UserInfo');
let BauCua_phien = require('../Models/BauCua/BauCua_phien');
let BauCua_cuoc = require('../Models/BauCua/BauCua_cuoc');
let BauCua_user = require('../Models/BauCua/BauCua_user');
let BauCua_temp = require('../Models/BauCua/BauCua_temp');

let bot = require('./baucua/bot');

const logger = require('./../web/logger');

let botList = [];
let totalBots = [];

let io = null;
let gameLoop = null;

let BCPlayTime = 30;
let BCTimeToNext = 10;

let init = function init(obj) {
	io = obj;
	io.BauCua_phien = 1;
	io.baucua = {
		ingame: []
	};
	io.baucua.info = {
		redBau: 0,
		redCa: 0,
		redCua: 0,
		redGa: 0,
		redHuou: 0,
		redTom: 0,
		xuBau: 0,
		xuCa: 0,
		xuCua: 0,
		xuGa: 0,
		xuHuou: 0,
		xuTom: 0,
	};

	io.baucua.infoAdmin = {
		redBau: 0,
		redCa: 0,
		redCua: 0,
		redGa: 0,
		redHuou: 0,
		redTom: 0,
		xuBau: 0,
		xuCa: 0,
		xuCua: 0,
		xuGa: 0,
		xuHuou: 0,
		xuTom: 0,
	};

	BauCua_phien.findOne({}, 'id', {
		sort: {
			'_id': -1
		}
	}, function (err, last) {
		if (!!last) {
			io.BauCua_phien = last.id + 1;
		}
		playGame();
	});
}

let thongtin_thanhtoan = function thongtin_thanhtoan(dice = null) {
	if (!!dice) {
		let heSo = {}; // Hệ số nhân
		for (let i = 0; i < 3; i++) {
			let dataT = dice[i];
			if (void 0 === heSo[dataT]) {
				heSo[dataT] = 1;
			} else {
				heSo[dataT] += 1;
			}
		}
		let updateLog = {};
		for (let j = 0; j < 6; j++) {
			if (void 0 !== heSo[j]) {
				updateLog[j] = heSo[j];
			}
		}
		let phien = io.BauCua_phien - 1;
		BauCua_temp.updateOne({}, {
			$inc: updateLog
		}).exec();
		BauCua_cuoc.find({
			phien: phien
		}, {}, function (err, list) {
			if (list.length) {
				Promise.all(list.map(function (cuoc) {
					let TienThang = 0; // Số tiền thắng (chưa tính gốc)
					let TongThua = 0; // Số tiền thua
					let TongThang = 0; // Tổng tiền thắng (đã tính gốc)
					let thuong = 0;
					let huou = 0;
					let bau = 0;
					let ga = 0;
					let ca = 0;
					let cua = 0;
					let tom = 0;

					// Cược Hươu
					if (cuoc[0] > 0) {
						if (void 0 !== heSo[0]) {
							huou = (cuoc[0] * heSo[0]);
							TienThang += huou;
							TongThang += cuoc[0] + huou;
						} else {
							TongThua += cuoc[0];
						}
					}
					// Cược Bầu
					if (cuoc[1] > 0) {
						if (void 0 !== heSo[1]) {
							bau = (cuoc[1] * heSo[1]);
							TienThang += bau;
							TongThang += cuoc[1] + bau;
						} else {
							TongThua += cuoc[1];
						}
					}
					// Cược Gà
					if (cuoc[2] > 0) {
						if (void 0 !== heSo[2]) {
							ga = (cuoc[2] * heSo[2]);
							TienThang += ga;
							TongThang += cuoc[2] + ga;
						} else {
							TongThua += cuoc[2];
						}
					}
					// Cược Cá
					if (cuoc[3] > 0) {
						if (void 0 !== heSo[3]) {
							ca = (cuoc[3] * heSo[3]);
							TienThang += ca;
							TongThang += cuoc[3] + ca;
						} else {
							TongThua += cuoc[3];
						}
					}
					// Cược Cua
					if (cuoc[4] > 0) {
						if (void 0 !== heSo[4]) {
							cua = (cuoc[4] * heSo[4]);
							TienThang += cua;
							TongThang += cuoc[4] + cua;
						} else {
							TongThua += cuoc[4];
						}
					}
					// Cược Tôm
					if (cuoc[5] > 0) {
						if (void 0 !== heSo[5]) {
							tom = (cuoc[5] * heSo[5]);
							TienThang += tom;
							TongThang += cuoc[5] + tom;
						} else {
							TongThua += cuoc[5];
						}
					}

					let tongDat = cuoc[0] + cuoc[1] + cuoc[2] + cuoc[3] + cuoc[4] + cuoc[5];

					let update = {};
					let updateGame = {};

					cuoc.thanhtoan = true;
					cuoc.betwin = TongThang;
					cuoc.save();

					if (cuoc.red) {
						//RED
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

						UserInfo.updateOne({
							id: cuoc.uid
						}, {
							$inc: update
						}).exec();
						BauCua_user.updateOne({
							uid: cuoc.uid
						}, {
							$inc: updateGame
						}).exec();
					}

					// Send settle websocket
					if (void 0 !== io.users[cuoc.uid]) {
						let status = {};
						if (TongThang > 0) {
							status = {
								mini: {
									baucua: {
										status: {
											win: true,
											bet: TongThang,
											thuong: thuong
										}
									}
								}
							};
						} else {
							status = {
								mini: {
									baucua: {
										status: {
											win: false,
											bet: TongThua
										}
									}
								}
							};
						}
						io.users[cuoc.uid].forEach(function (client) {
							client.red(status);
						});
						status = null;
					}
					// TongThua = null;
					// TongThang = null;
					// thuong = null;
					// huou = null;
					// bau = null;
					// ga = null;
					// ca = null;
					// cua = null;
					// tom = null;
					// tongDat = null;
					// update = null;
					// updateGame = null;

					return {
						users: cuoc.name,
						bet: TienThang,
						red: cuoc.red,
						tienThua: TongThua,
						tienDat: tongDat
					};
				}))
					.then(function (results) {
						let resultWithoutBots = results.filter(function (rs) { return totalBots.filter(bot => bot.name == rs.users).length == 0 });
						if (resultWithoutBots.length > 0) {
							const logMessages = [
								`BC Result Phien (round) ${phien} at ${new Date()}`,
								`BC Result Dice ${JSON.stringify(dice)}`,
								`BC Result Heso ${JSON.stringify(heSo)}`,
								`BC User Settle`,
								JSON.stringify(resultWithoutBots)
							];
							logger.log(logMessages.join('\n'));
						}

						results = results.filter(function (st) { return (st.red && st.bet > 0); });
						if (results.length) {

							results.sort(function (a, b) { return b.bet - a.bet; });
							results = results.slice(0, 1);
							results = Helpers.shuffle(results);
							results.forEach((result) => {
								io.sendInHome({
									news: {
										a: {
											users: result.users,
											bet: result.bet,
											game: 'Bầu Cua'
										}
									}
								});
							});
						}
						heSo = null;
						phien = null;
						dice = null;
						playGame();
					})
					.catch(error => logger.logError(error));
			} else {
				heSo = null;
				phien = null;
				dice = null;
				playGame();
			}
		});
	} else {
		Object.values(io.users).forEach(function (users) {
			users.forEach(function (client) {
				if (client.gameEvent !== void 0 && client.gameEvent.viewBauCua !== void 0 && client.gameEvent.viewBauCua) {
					client.red({
						mini: {
							baucua: {
								data: io.baucua.info
							}
						}
					});
				}
			});
		});

		let admin_data = {
			baucua: {
				info: io.baucua.infoAdmin,
				ingame: io.baucua.ingame
			}
		};
		Object.values(io.admins).forEach(function (admin) {
			admin.forEach(function (client) {
				if (client.gameEvent !== void 0 && client.gameEvent.viewBauCua !== void 0 && client.gameEvent.viewBauCua) {
					client.red(admin_data);
				}
			});
		});
	}
}

let playGame = function () {
	io.BauCua_time = BCPlayTime + BCTimeToNext + 1;

	gameLoop = setInterval(function () {
		io.BauCua_time--;
		if (io.BauCua_time <= BCPlayTime) {
			if (io.BauCua_time < 0) {
				clearInterval(gameLoop);
				io.BauCua_time = 0;

				fs.readFile('./data/baucua.json', 'utf8', (errjs, bcjs) => {
					try {
						bcjs = JSON.parse(bcjs);

						let dice1 = bcjs[0] == 6 ? (Math.random() * 6) >> 0 : bcjs[0];
						let dice2 = bcjs[1] == 6 ? (Math.random() * 6) >> 0 : bcjs[1];
						let dice3 = bcjs[2] == 6 ? (Math.random() * 6) >> 0 : bcjs[2];

						bcjs[0] = 6;
						bcjs[1] = 6;
						bcjs[2] = 6;
						bcjs.uid = '';
						bcjs.rights = 2;

						fs.writeFile('./data/baucua.json', JSON.stringify(bcjs), function (err) { });

						BauCua_phien.create({
							'dice1': dice1,
							'dice2': dice2,
							'dice3': dice3,
							'time': new Date()
						}, function (err, create) {
							if (!!create) {
								io.BauCua_phien = create.id + 1;
								thongtin_thanhtoan([dice1, dice2, dice3]);
								io.sendAllUser({
									mini: {
										baucua: {
											finish: {
												dices: [create.dice1, create.dice2, create.dice3],
												phien: create.id
											}
										}
									}
								});

								Object.values(io.admins).forEach(function (admin) {
									admin.forEach(function (client) {
										client.red({
											baucua: {
												finish: true,
												dices: [create.dice1, create.dice2, create.dice3]
											}
										});
									});
								});
							}
						});
					} catch (error) { }
				});
				io.baucua.ingame = [];
				io.baucua.info = {
					redBau: 0,
					redCa: 0,
					redCua: 0,
					redGa: 0,
					redHuou: 0,
					redTom: 0,
					xuBau: 0,
					xuCa: 0,
					xuCua: 0,
					xuGa: 0,
					xuHuou: 0,
					xuTom: 0,
				};
				io.baucua.infoAdmin = {
					redBau: 0,
					redCa: 0,
					redCua: 0,
					redGa: 0,
					redHuou: 0,
					redTom: 0,
					xuBau: 0,
					xuCa: 0,
					xuCua: 0,
					xuGa: 0,
					xuHuou: 0,
					xuTom: 0,
				};

				fs.readFile('./config/baucua.json', 'utf8', (errcf, bccf) => {
					try {
						bccf = JSON.parse(bccf);
						if (bccf.bot) {
							// lấy danh sách tài khoản bot
							UserInfo.find({
								type: true
							}, 'id name', function (err, blist) {
								if (blist.length) {
									Promise.all(blist.map(function (buser) {
										buser = buser._doc;
										delete buser._id;

										return buser;
									}))
										.then(result => {
											totalBots = result;
											let maxBot = (result.length * 50 / 100) >> 0;
											botList = Helpers.shuffle(result);
											botList = botList.slice(0, maxBot);
										});
								}
							});
						} else {
							botList = [];
						}
					} catch (error) {
						botList = [];
					}
				});
			} else {
				thongtin_thanhtoan();
				if (!!botList.length && io.BauCua_time > 2) {
					let userCuoc = (Math.random() * 5) >> 0;
					for (let i = 0; i < userCuoc; i++) {
						let dataT = botList[i];
						if (!!dataT) {
							bot(dataT, io);
							botList.splice(i, 1); // Xoá bot đã đặt tránh trùng lặp
						}
						dataT = null;
					}
				}
			}
		}
	}, 1000);
	return gameLoop;
}

module.exports = init;