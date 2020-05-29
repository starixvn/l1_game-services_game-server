
let ChanLeCuoc = require('../../Models/ChanLe/ChanLe_cuoc');
let ChanLeCuocOne = require('../../Models/ChanLe/ChanLe_one');
let Helper = require('../../Helpers/Helpers');

let cl = function (bot, io, maxBet, minBet) {
    let cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);

    // console.log("CL bot bet " + cuoc);

    let select = !!((Math.random() * 2) >> 0);

    if(io.ChanLe_time > 5){
        if (select) {
            io.chanle.chanle.red_chan += cuoc;
            io.chanle.chanle.red_player_chan += 1;
        } else {
            io.chanle.chanle.red_le += cuoc;
            io.chanle.chanle.red_player_le += 1;
        }
      
        ChanLeCuoc.create({ uid: bot.id, name: bot.name, phien: io.ChanLe_phien, bet: cuoc, select: select, red: true, time: new Date() });

        var update = {};
		update[bet] += cuoc;

        let create = { uid: bot.id, phien: io.ChanLe_phien, red: true, select: select, time: new Date() };
        
        ChanLeCuocOne.updateOne(
			{ uid: bot.id, phien: io.ChanLe_phien, red: true },
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
