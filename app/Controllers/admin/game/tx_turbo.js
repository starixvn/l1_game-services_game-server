const get_time = require('./txturbo/get_time');
const get_top = require('./txturbo/get_top');
const viewDashboard = require('./txturbo/dashboard');

module.exports = function (client, data) {
    if (void 0 !== data.view) {
        client.gameEvent.viewTaiXiuTurbo = !!data.view
    }
    if (void 0 !== data.get_time) {
        get_time(client);
    }
    if (void 0 !== data.dashboard) {
        if (void 0 !== data.dashboard.view) {
            viewDashboard(client, data.dashboard.view);
        }
        if (void 0 !== data.dashboard.get_top) {
            get_top(client, data.dashboard.get_top);
        }
    }
}
