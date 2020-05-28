
let ChanLeTurboCuoc = require('../../Models/ChanLeTurbo/ChanLeTurbo_cuoc');
let ChanLeTurboOne = require('../../Models/ChanLeTurbo/ChanLeTurbo_one');
let Helper = require('../../Helpers/Helpers');

// Chẵn Lẻ RED
let cl = function (bot, io, maxBet, minBet) {
    let cuoc = Helper.getRandomNumberWithMinMax(minBet, maxBet);

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
        
        ChanLeTurboCuoc.create({ uid: bot.id, name: bot.name, phien: io.ChanLeTurbo_phien, bet: cuoc, select: select, red: true, time: new Date() });       

        var update = {bet : cuoc};

        let create = { uid: bot.id, phien: io.ChanLeTurbo_phien, red: true, select: select, time: new Date() };
        
        ChanLeTurboOne.updateOne(
			{ uid: bot.id, phien: io.ChanLeTurbo_phien, red: true },
			{ $inc: update, $setOnInsert: create },
			{ upsert: true, setDefaultsOnInsert: true },
			function (err, doc) {
				if (err) {
					logger.logError(err);
					console.log(err);
				}
			});
    }
    
    bot = null;
    io = null;
    cuoc = null;
    select = null;
};
module.exports = {
    cl: cl,
}
