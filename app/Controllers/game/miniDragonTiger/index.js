let cuoc = require('./cuoc').miniDragonTigerCuoc;
let getLogs = require('./getLogs');

module.exports = function (client, data) {
    if (void 0 !== data.view) {
        client.gameEvent.viewMiniDragonTiger = !!data.view;
    }

    if (!!data.cuoc) {
        cuoc(client, data.cuoc);
    }

    if (!!data.getLogs) {
        getLogs(client);
    }
};