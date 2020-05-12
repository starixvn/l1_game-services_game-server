let getTime = require('./get-time');
let placeBet = require('./place-bet');
let getLogs = require('./get-logs');
let viewLogs = require('./view-logs');

module.exports = function (client, data) {
    if (void 0 !== data.view) {
        client.gameEvent.viewMiniSedie = !!data.view;
    }

    if (!!data.get_time) {
        getTime(client);
    }

    if (!!data.cuoc) {
        placeBet(client, data.cuoc);
    }

    if (!!data.getLogs) {
        getLogs(client);
    }

    if (!!data.viewlogs) {
        viewLogs(client, data.viewlogs)
    }
};