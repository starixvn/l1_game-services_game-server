
var chuyen = require('./history/chuyen');
var taixiu = require('./history/taixiu');
var baucua = require('./history/baucua');
var xocxoc = require('./history/xocxoc');
var txturbo = require('./history/txturbo');

module.exports = function (client, data) {
	if (!!data.chuyen) {
		chuyen(client, data.chuyen);
	}
	if (!!data.taixiu) {
		taixiu(client, data.taixiu);
	}
	if (!!data.baucua) {
		baucua(client, data.baucua);
	}
	if (!!data.xocxoc) {
		xocxoc(client, data.xocxoc);
	}
	if (!!data.taixiu_turbo) {
		txturbo(client, data.taixiu_turbo);
	}
}
