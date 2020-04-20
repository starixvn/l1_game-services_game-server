
let ChanLeCuoc = require('../../Models/ChanLe/ChanLe_cuoc');
let ChanLeCuocOne = require('../../Models/ChanLe/ChanLe_one');
/**
 * Ngẫu nhiên cược
 * return {number}
*/
let random = function () {
    let a = (Math.random() * 35) >> 0;
    if (a == 34) {
        // 34
        return (Math.floor(Math.random() * (50 - 20 + 1)) + 20) * 10;
    } else if (a >= 32 && a < 34) {
        // 32 33
        return (Math.floor(Math.random() * (30 - 20 + 1)) + 20) * 10;
    } else if (a >= 30 && a < 32) {
        // 30 31 32
        return (Math.floor(Math.random() * (20 - 10 + 1)) + 10) * 10;
    } else if (a >= 26 && a < 30) {
        // 26 27 28 29
        return (Math.floor(Math.random() * (15 - 5 + 1)) + 5) * 10;
    } else if (a >= 21 && a < 26) {
        // 21 22 23 24 25
        return (Math.floor(Math.random() * (15 - 3 + 1)) + 3) * 10;
    } else if (a >= 15 && a < 21) {
        // 15 16 17 18 19 20
        return (Math.floor(Math.random() * (100 - 30 + 1)) + 30) * 1;
    } else if (a >= 8 && a < 15) {
        // 8 9 10 11 12 13 14
        return (Math.floor(Math.random() * (50 - 20 + 1)) + 20) * 1;
    } else {
        // 0 1 2 3 4 5 6 7
        return (Math.floor(Math.random() * (30 - 20 + 1)) + 20) * 1;
    }
};

// Chẵn Lẻ RED
let cl = function (bot, io) {
    let cuoc = random();
    let select = !!((Math.random() * 2) >> 0);
    if (select) {
        io.chanle.chanle.red_chan += cuoc;
        io.chanle.chanle.red_player_chan += 1;
    } else {
        io.chanle.chanle.red_le += cuoc;
        io.chanle.chanle.red_player_le += 1;
    }
    ChanLeCuocOne.create({ uid: bot.id, phien: io.ChanLe_phien, select: select, red: true, bet: cuoc });
    ChanLeCuoc.create({ uid: bot.id, name: bot.name, phien: io.ChanLe_phien, bet: cuoc, select: select, red: true, time: new Date() });
    bot = null;
    io = null;
    cuoc = null;
    select = null;
};
module.exports = {
    cl: cl,
}
