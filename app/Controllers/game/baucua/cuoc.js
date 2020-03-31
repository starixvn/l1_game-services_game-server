var BauCua_cuoc = require('../../../Models/BauCua/BauCua_cuoc');
var balanceApi = require('./../../../apis/balanceApi');
const gameIds = require('./../../../../config/appConfigs').gameIds;
let Config = require("../../../../config/baucua.json");
const betChoiceMapper = require('./../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');

let BCPlayTime = 30;
let BCStopBetTime = 5;

function bauCuaCuoc(client, data) {
	if (!!data && !!data.cuoc) {
		var cuoc = data.cuoc >> 0;
		var red = !!data.red;
		var linhVat = data.linhVat >> 0;
		var response = {
			mini: {
				baucua: {
					endCuoc: -1
				}
			}
		};
		var baucuaData = response.mini.baucua;

		if (client.redT.BauCua_time <= BCStopBetTime || client.redT.BauCua_time > BCPlayTime) {
			baucuaData.notice = 'Vui lòng cược ở phiên sau.!!';
			client.red(response);
			return;
		}

		if (cuoc < Config.minBet) {
			baucuaData.notice = 'Tiền cược tối thiểu là ' + Config.minBet;
			client.red(response);
			return;
		}

		if (cuoc > Config.maxBet) {
			baucuaData.notice = 'Tiền cược tối đa là ' + Config.maxBet;
			client.red(response);
			return;
		}

		var currentCuoc = 0;
		var clientCuoc = client.redT.baucua.ingame.find(uOld => uOld.uid == client.UID && uOld.red == red);

		if (clientCuoc) {
			for (var i = 0; i < 6; i++) {
				currentCuoc += clientCuoc[i];
			}
		}

		if (currentCuoc + cuoc > Config.maxBet) {
			baucuaData.notice = 'Tiền cược tối đa là ' + Config.maxBet;
			client.red(response);
			return;
		}

		if (linhVat < 0 || linhVat > 5) {
			baucuaData.notice = 'Cược thất bại...';
			client.red(response);
		} else {
			var io = client.redT;
			if (clientCuoc) {
				io.baucua.ingame.forEach(function (uOld) {
					if (uOld.uid == client.UID && uOld.red == red) {
						uOld[linhVat] += cuoc;
						uOld.cuocQueue.push({ data: data, client: client });
					}
				});
			} else {
				var addList = {
					uid: client.UID, name: client.profile.name, red: red, '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
					cuocQueue: [{ data: data, client: client }],
					info: io.baucua.info, infoAdmin: io.baucua.infoAdmin
				};

				addList[linhVat] = cuoc;
				io.baucua.ingame.unshift(addList);
			}
		}
	}
};

function processPlaceBet(client, data, info, infoAdmin, io) {

	if (!!data && !!data.cuoc) {
		var cuoc = data.cuoc >> 0;
		var red = !!data.red;
		var linhVat = data.linhVat >> 0;
		let placeBetSuccess = function (user) {
			var dataXu = [
				'meXuHuou',
				'meXuBau',
				'meXuGa',
				'meXuCa',
				'meXuCua',
				'meXuTom',
			]
			var dataRed = [
				'meRedHuou',
				'meRedBau',
				'meRedGa',
				'meRedCa',
				'meRedCua',
				'meRedTom',
			]
			var tab = red ? dataRed : dataXu;
			var data = {};
			BauCua_cuoc.findOne({ uid: client.UID, phien: client.redT.BauCua_phien, red: red }, function (err, checkOne) {
				if (err) {
					logger.logError(err);
					return;
				}

				if (checkOne) {
					var update = {};
					update[linhVat] = cuoc;
					BauCua_cuoc.findOneAndUpdate({ uid: client.UID, phien: client.redT.BauCua_phien, red: red }, { $inc: update }, function (err, cat) {
						if (err) {
							logger.logError(err);
							return;
						}
						tab.forEach(function (o, i) {
							data[o] = cat[i] + (i == linhVat ? cuoc : 0);
							return (data[o] = cat[i] + (i == linhVat ? cuoc : 0));
						});
						var dataT = {
							mini: { baucua: { data: data, endCuoc: cuoc } },
							user: { red: user.red, xu: user.xu }
						};
						client.redT.users[client.UID].map(function (obj) {
							obj.red(dataT);
						});
					});

				} else {
					var create = { uid: client.UID, name: client.profile.name, phien: client.redT.BauCua_phien, red: red, time: new Date() };
					if (client.session) {
						create.memberId = client.session.memberId;
						create.siteId = client.session.siteId;
					}
					create[linhVat] = cuoc;
					BauCua_cuoc.create(create);
					data[tab[linhVat]] = cuoc;
					var dataT = {
						mini: { baucua: { data: data, endCuoc: cuoc } },
						user: { red: user.red, xu: user.xu }
					};
					client.redT.users[client.UID].forEach(function (obj) {
						obj.red(dataT);
					});
				}

				if (linhVat == 0) {
					info.redHuou += cuoc;
					infoAdmin.redHuou += cuoc;
				} else if (linhVat == 1) {
					info.redBau += cuoc;
					infoAdmin.redBau += cuoc;
				} else if (linhVat == 2) {
					info.redGa += cuoc;
					infoAdmin.redGa += cuoc;
				} else if (linhVat == 3) {
					info.redCa += cuoc;
					infoAdmin.redCa += cuoc;
				} else if (linhVat == 4) {
					info.redCua += cuoc;
					infoAdmin.redCua += cuoc;
				} else if (linhVat == 5) {
					info.redTom += cuoc;
					infoAdmin.redTom += cuoc;
				}

				io.baucua.ingame.forEach(function (uOld) {
					if (uOld.uid == client.UID && uOld.red == red) {
						uOld.currentCuoc = null;
					}
				});
			})
		};

		let placeBetFailed = function () {
			client.red({
				mini: {
					baucua: {
						endCuoc: -1
					}
				}
			});

			io.baucua.ingame.forEach(function (uOld) {
				if (uOld.uid == client.UID && uOld.red == red) {
					uOld[linhVat] -= cuoc;
					uOld.currentCuoc = null;
				}
			});
		};

		data.inSufficientBalance = { mini: { baucua: { notice: 'Bạn hiện không có đủ tiền để cược.' } } };
		data.gameId = gameIds.baucua;
		data.gameRoundId = client.redT.BauCua_phien;
		data.choiceId = betChoiceMapper.convertBauCua(linhVat);

		balanceApi.placeBet({ id: client.UID }, data, client, placeBetSuccess, placeBetFailed);

	}
}

function processBetQueue(io) {
	try {
		io.baucua.ingame.forEach(function (userBet) {
			if (userBet.cuocQueue && userBet.cuocQueue.length > 0 && userBet.currentCuoc == null) {

				userBet.currentCuoc = userBet.cuocQueue.shift();

				setTimeout(() => {
					processPlaceBet(userBet.currentCuoc.client, userBet.currentCuoc.data, io.baucua.info, io.baucua.infoAdmin, io);
				}, 0);
			}
		});
	}
	catch (ex) {
		console.log(JSON.stringify({ message: ex.message, stack: ex.stack }));
	}
}

function initUserQueueProcessing(io) {
	const processTimeOut = 50;
	setTimeout(function processBets() {

		processBetQueue(io);

		setTimeout(processBets, processTimeOut);
	}, processTimeOut);
}

module.exports = {
	bauCuaCuoc,
	processPlaceBet,
	initUserQueueProcessing
};