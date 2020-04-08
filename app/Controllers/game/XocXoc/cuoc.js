
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let Config = require("../../../../config/xocxoc.json");
const balanceApi = require('./../../../apis/balanceApi');
const gameIds = require('./../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('./../../../apis/betChoiceMapper');
const logger = require('../../../web/logger');

function xocxocCuoc(client, data) {
	if (!!data.cuoc && !!data.box) {
		let cuoc = data.cuoc >> 0;
		let red = !!data.red;
		let box = data.box;
		let xocxoc = client.redT.game.xocxoc;

		if (xocxoc.time > 31 && xocxoc.time <= 33) {
			client.red({ xocxoc: { notice: 'Không thể đặt cược vào lúc này.' } });
			return;
		}

		if (xocxoc.time < 6 || xocxoc.time > 33) {
			client.red({ xocxoc: { notice: 'Vui lòng đặt cược ở phiên sau.' } });
			return;
		}

		if (!(cuoc === 1 || cuoc === 5 || cuoc === 10 || cuoc === 50 || cuoc === 100 || cuoc === 200) ||
			!(box === 'chan' || box === 'le' || box === 'red3' || box === 'red4' || box === 'white3' || box === 'white4')) {
			client.red({ mini: { XocXoc: { notice: 'Cược thất bại...' } } });
			return;
		}

		if (cuoc < Config.minBet) {
			client.red({ xocxoc: { notice: "Tiền cược tối thiểu là " + Config.minBet } });
			return;
		}

		if (cuoc > Config.maxBet) {
			client.red({ xocxoc: { notice: "Tiền cược tối đa là " + Config.maxBet } });
			return;
		}

		let userCuoc = xocxoc.ingame.red[client.profile.name];
		if (userCuoc && (userCuoc['chan'] + userCuoc['le'] + userCuoc['red3'] + userCuoc['red4'] + userCuoc['white3'] + userCuoc['white4'] + cuoc) > Config.maxBet) {
			client.red({ xocxoc: { notice: "Tiền cược tối đa là " + Config.maxBet } });
			return;
		}

		if (userCuoc) {
			xocxoc.ingame.red[client.profile.name][box] += cuoc;
			xocxoc.ingame.red[client.profile.name].cuocQueue.push({ data: data, client: client });
		} else {
			let newData = { name: client.profile.name, 'chan': 0, 'le': 0, 'red3': 0, 'red4': 0, 'white3': 0, 'white4': 0, cuocQueue: [{ data: data, client: client }] };
			newData[box] = cuoc;
			xocxoc.ingame.red[client.profile.name] = newData;
		}
	}
};

function processPlacingBet(client, data, redT) {
	try {

		if (client.redT == null || client.redT.game == null || client.redT.game.xocxoc == null) {
			return;
		}

		let cuoc = data.cuoc >> 0;
		let red = !!data.red;
		let box = data.box;
		let xocxoc = client.redT.game.xocxoc;

		data.inSufficientBalance = { xocxoc: { notice: 'Bạn hiện không có đủ tiền để cược.' } };
		data.gameId = gameIds.xocxoc;
		data.gameRoundId = client.redT.game.xocxoc.phien;
		data.choiceId = betChoiceMapper.convertXocXoc(box);

		let placeBetSuccess = function (user) {
			XocXoc_cuoc.findOne({ uid: client.UID, phien: xocxoc.phien, red: red }, function (err, checkOne) {
				if (err) {
					logger.logError(err);
				}

				try {
					if (checkOne) {
						checkOne[box] += cuoc;
						checkOne.save();
					} else {
						var create = { uid: client.UID, name: client.profile.name, phien: xocxoc.phien, red: red, time: new Date() };
						if (client.session) {
							create.memberId = client.session.memberId;
							create.siteId = client.session.siteId;
						}
						create[box] = cuoc;
						XocXoc_cuoc.create(create);
					}

					xocxoc.data.red[box] += cuoc;
					xocxoc.dataAdmin.red[box] += cuoc;
					xocxoc.chip[box][cuoc] += 1;

					let currentMeCuoc = xocxoc.ingame.red[client.profile.name];
					let me_cuoc = {
						'chan': currentMeCuoc.chan,
						'le': currentMeCuoc.le,
						'red3': currentMeCuoc.red3,
						'red4': currentMeCuoc.red4,
						'white3': currentMeCuoc.white3,
						'white4': currentMeCuoc.white4
					};

					xocxoc.ingame.red[client.profile.name].currentCuoc = null;

					if (xocxoc.players[client.UID]) {
						xocxoc.players[client.UID].red = user.red;
					}

					Object.values(xocxoc.clients).forEach(function (users) {
						if (client.UID !== users.UID) {
							users.red({ xocxoc: { chip: { playerId: client.UID, box: box, cuoc: cuoc, red: user.red } } });
						}
						else {
							const successMessage = { xocxoc: { mechip: { box: box, cuoc: data.cuoc }, me: { red: me_cuoc } }, user: { red: user.red, xu: user.xu } };
							users.red(successMessage);
						}
					});
				}
				catch (ex) {
					logger.logError(ex);
					xocxoc.ingame.red[client.profile.name].currentCuoc = null;
				}
			});
		};

		let placeBetFailed = function () {
			try {
				let currentUser = xocxoc.ingame.red[client.profile.name];
				currentUser[box] -= cuoc;

				currentUser.currentCuoc = null;
			}
			catch (ex) {
				logger.logError(ex);
			}
		}

		balanceApi.placeBet({ id: client.UID }, data, client, placeBetSuccess, placeBetFailed);

	} catch (error) {
		logger.logError(error);
	}
}

function processBetQueue(io) {
	try {
		if (io.game.xocxoc.ingame.red) {
			for (const userBetName in io.game.xocxoc.ingame.red) {
				let userBet = io.game.xocxoc.ingame.red[userBetName];
				if (userBet) {
					if (userBet.cuocQueue && userBet.cuocQueue.length > 0 && userBet.currentCuoc == null) {
						userBet.currentCuoc = userBet.cuocQueue.shift();

						setTimeout(() => {
							try {
								processPlacingBet(userBet.currentCuoc.client, userBet.currentCuoc.data, io);
							}
							catch (ex) {
								logger.logError(ex);
								userBet.currentCuoc = null;
							}
						}, 0);
					}
				}
			}
		}
	}
	catch (ex) {
		logger.logError(ex);

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


module.exports =
{
	xocxocCuoc,
	initUserQueueProcessing
};