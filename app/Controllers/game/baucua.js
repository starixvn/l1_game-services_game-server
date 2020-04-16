
var cuoc = require('./baucua/cuoc');
var regOpen = require('./baucua/regOpen');
var viewlogs = require('./baucua/viewlogs');
var tops = require('./baucua/tops');
let bauCuaConfigs = require('../../Controllers/Game/baucua/configs');

module.exports = function (client, data) {
	if (void 0 !== data.view) {
		client.gameEvent.viewBauCua = !!data.view;
	}

	if (!!data.get_odd) {
		client.red({
			mini: { baucua: { odds: bauCuaConfigs.odds } }
		});
	}

	if (!!data.regOpen) {
		regOpen(client);
	}
	if (!!data.cuoc) {
		cuoc.bauCuaCuoc(client, data.cuoc)
	}
	if (void 0 !== data.tops) {
		tops(client, data.tops)
	}
	if (!!data.viewlogs) {
		viewlogs(client, data.viewlogs)
	}
};
