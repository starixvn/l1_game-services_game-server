const ChanLeTurbo_get = require('./chanle_turbo/get_time');
const ChanLeTurbo_dashboard = require('./chanle_turbo/dashboard');

module.exports = function (client, data) {
    if (void 0 !== data.view) {
        client.gameEvent.viewChanLeTurbo = !!data.view
    }
    if (void 0 !== data.get_time) {
        ChanLeTurbo_get(client);
    }

    if (void 0 !== data.dashboard) {
        ChanLeTurbo_dashboard(client, data.dashboard);
    }
}
