
let users = require('./socketUsers');
let admin = require('./socketAdmin');
const config = require('./config/appConfigs');

// Router Websocket
module.exports = function (app, redT) {
	const rateLimit = require('ws-rate-limit')('1s', config.rateLimit.requestPerSecond);

	app.ws('/websocket', function (ws, req) {
		config.rateLimit.enabled && rateLimit(ws);
		users(ws, redT, req);
	});
	app.ws('/admin', function (ws, req) {
		admin(ws, redT)
	});
};
