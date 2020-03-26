
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let UserInfo = require('../../../Models/UserInfo');
let Config = require("../../../../config/xocxoc.json");
const balanceApi = require('./../../../apis/balanceApi');
const gameIds = require('./../../../../config/appConfigs').gameIds;
const betChoiceMapper = require('./../../../apis/betChoiceMapper');

module.exports = function (client, data) {
	if (!!data.cuoc && !!data.box) {
		let cuoc = data.cuoc >> 0;
		let red = !!data.red;
		let box = data.box;
		let xocxoc = client.redT.game.xocxoc;

		if (xocxoc.time > 31 && xocxoc.time <= 33) {
			client.red({ xocxoc: { notice: 'Không thể đặt cược vào lúc này.!!' } });
			return;
		}

		if (xocxoc.time < 6 || xocxoc.time > 33) {
			client.red({ xocxoc: { notice: 'Vui lòng cược ở phiên sau.!!' } });
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

		XocXoc_cuoc.findOne({ uid: client.UID, phien: xocxoc.phien, red: red }, function (err, checkOne) {
			if (checkOne && (checkOne['chan'] + checkOne['le'] + checkOne['red3'] + checkOne['red4'] + checkOne['white3'] + checkOne['white4'] + cuoc) > Config.maxBet) {
				client.red({ xocxoc: { notice: "Tiền cược tối đa là " + Config.maxBet } });
			} else {
				data.inSufficientBalance = { xocxoc: { notice: 'Bạn không đủ tiền để cược.!!' } };
				data.gameId = gameIds.xocxoc;
				data.gameRoundId = client.redT.game.xocxoc.phien;
				data.choiceId = betChoiceMapper.convertXocXoc(box);

				balanceApi.placeBet({ id: client.UID }, data, client, function (user) {
					xocxoc.chip[box][cuoc] += 1;

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

					let newData = {
						'chan': 0,
						'le': 0,
						'red3': 0,
						'red4': 0,
						'white3': 0,
						'white4': 0,
					};
					newData[box] = cuoc;
					let me_cuoc = {};
					if (red) {
						xocxoc.data.red[box] += cuoc;
						xocxoc.dataAdmin.red[box] += cuoc;
						if (xocxoc.ingame.red[client.profile.name]) {
							xocxoc.ingame.red[client.profile.name][box] += cuoc;
						} else {
							xocxoc.ingame.red[client.profile.name] = newData;
						}
						me_cuoc.red = xocxoc.ingame.red[client.profile.name];
					} else {
						xocxoc.data.xu[box] += cuoc;
						xocxoc.dataAdmin.xu[box] += cuoc;
						if (xocxoc.ingame.xu[client.profile.name]) {
							xocxoc.ingame.xu[client.profile.name][box] += cuoc;
						} else {
							xocxoc.ingame.xu[client.profile.name] = newData;
						}
						me_cuoc.xu = xocxoc.ingame.xu[client.profile.name];
					}
					Object.values(xocxoc.clients).forEach(function (users) {
						if (client !== users) {
							users.red({ xocxoc: { chip: { playerId: client.UID, box: box, cuoc: cuoc, red: user.red } } });
						} else {
							users.red({ xocxoc: { mechip: { box: box, cuoc: data.cuoc }, me: me_cuoc }, user: { red: user.red, xu: user.xu } });
						}
					});

					me_cuoc = null;
					newData = null;
					xocxoc = null;
					client = null;
					data = null;

					cuoc = null;
					red = null;
					box = null;
				});
			}
		})

	}
};
