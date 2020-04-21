
let ChanLeCuoc = require('../../Models/ChanLe/ChanLe_cuoc');
let ChanLeCuocOne = require('../../Models/ChanLe/ChanLe_one');
let Helper = require('../../Helpers/Helpers');
/**
 * Ngẫu nhiên cược
 * return {number}
*/

// Chẵn Lẻ RED
let cl = function (bot, io, maxBet) {
    let cuoc = Helper.getRandomNumberStep5(maxBet, false);

    // console.log("CL bot bet " + cuoc);

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
