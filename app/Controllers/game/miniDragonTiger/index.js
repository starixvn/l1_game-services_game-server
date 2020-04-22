let cuoc = require('./cuoc');

module.exports = function (client, data) {
    if (!!data.cuoc) {
        cuoc(client, data.cuoc);
    }
};