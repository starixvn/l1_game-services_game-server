
let Admin = require('./Admin');
let Users = require('./panel/Users');
let NapThe = require('./panel/NapThe');
let MuaThe = require('./panel/MuaThe');
let Shop = require('./panel/Shop');
let GiftCode = require('./panel/GiftCode');
let HeThong = require('./panel/HeThong');

let TaiXiu = require('./game/taixiu');
let TXTurbo = require('./game/tx_turbo');
let BauCua = require('./game/baucua');
let MiniPoker = require('./game/mini_poker');
let BigBabol = require('./game/big_babol');
let VuongQuocRed = require('./game/vq_red');
let mini3cay = require('./game/mini3cay');
let angrybirds = require('./game/angrybirds');
let XocXoc = require('./game/xocxoc');

let candy = require('./game/candy');
let longlan = require('./game/longlan');
let xs = require('./game/xs');

let ChanLe = require('./game/chanle');
let ChanLeTurbo = require('./game/chane_turbo');
let miniDragonTiger = require('./game/mini_dragon_tiger');

module.exports = function (client, data) {
	if (!!data) {
		if (!!data.admin) {
			Admin.onData(client, data.admin)
		}

		// Begin Game
		if (!!data.taixiu) {
			TaiXiu(client, data.taixiu)
		}
		if (!!data.taixiu_turbo) {
			TXTurbo(client, data.taixiu_turbo)
		}
		if (!!data.baucua) {
			BauCua(client, data.baucua)
		}
		if (!!data.mini_poker) {
			MiniPoker(client, data.mini_poker)
		}
		if (!!data.big_babol) {
			BigBabol(client, data.big_babol)
		}
		if (!!data.vq_red) {
			VuongQuocRed(client, data.vq_red)
		}
		if (!!data.mini3cay) {
			mini3cay(client, data.mini3cay)
		}
		if (!!data.angrybird) {
			angrybirds(client, data.angrybird)
		}
		if (!!data.candy) {
			candy(client, data.candy)
		}
		if (!!data.longlan) {
			longlan(client, data.longlan)
		}
		if (!!data.xocxoc) {
			XocXoc(client, data.xocxoc)
		}

		if (!!data.chanle) {
			ChanLe(client, data.chanle);
		}

		if (!!data.clturbo) {
			ChanLeTurbo(client, data.clturbo);
		}
		// End Game

		if (!!data.nap_the) {
			NapThe(client, data.nap_the)
		}
		if (!!data.mua_the) {
			MuaThe(client, data.mua_the)
		}
		if (!!data.users) {
			Users(client, data.users)
		}
		if (!!data.shop) {
			Shop(client, data.shop)
		}
		if (!!data.giftcode) {
			GiftCode(client, data.giftcode);
		}
		if (!!data.sys) {
			HeThong(client, data.sys);
		}
		if (!!data.xs) {
			xs(client, data.xs);
		}
		if (!!data.mini_dragon_tiger) {
			miniDragonTiger(client, data.mini_dragon_tiger);
		}
	}
}
