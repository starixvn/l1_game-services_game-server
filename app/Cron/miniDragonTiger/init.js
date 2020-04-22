let MiniDragonTiger_Phien = require('./../../Models/MiniDragonTiger/MiniDragonTiger_phien');

let io = null;

module.exports = function (obj) {
    io = obj;

    io.miniDragonTiger = {
        phien: 1,
        time: 0,
        ingame: [],
        data: defaultData,
        dataAdmin: defaultData
    };

    MiniDragonTiger_Phien.findOne({}, 'id', { sort: { '_id': -1 } }, (err, last) => {
        if (!!last) {
            io.miniDragonTiger.phien = last.id + 1;
        }

        playGame(io);
    });
};