
let ChanLeCuoc = require('../../Models/ChanLeTurbo/ChanLeTurbo_cuoc');
let ChanLeCuocOne = require('../../Models/ChanLeTurbo/ChanLeTurbo_one');
let Helper = require('../../Helpers/Helpers');

// Chẵn Lẻ RED
let cl = function (bot, io, maxBet, minBet) {
    let cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);

    // console.log("CL Turbo bot bet " + cuoc);

    let select = !!((Math.random() * 2) >> 0);

    if(io.ChanLeTurbo_time > 5)
    {
        if (select) {
            io.clturbo.clturbo.red_chan += cuoc;
            io.clturbo.clturbo.red_player_chan += 1;
        } else {
            io.clturbo.clturbo.red_le += cuoc;
            io.clturbo.clturbo.red_player_le += 1;
        }
        ChanLeCuocOne.create({ uid: bot.id, phien: io.ChanLeTurbo_phien, select: select, red: true, bet: cuoc });
        ChanLeCuoc.create({ uid: bot.id, name: bot.name, phien: io.ChanLeTurbo_phien, bet: cuoc, select: select, red: true, time: new Date() });
    }
    
    bot = null;
    io = null;
    cuoc = null;
    select = null;
};
module.exports = {
    cl: cl,
}
