
let TXTurboCuoc = require('../../Models/TXTurbo/TXTurbo_cuoc');
let TXTurboCuocOne = require('../../Models/TXTurbo/TXTurbo_one');
let Helper = require('../../Helpers/Helpers');

module.exports = function (bot, io, maxBet, minBet) {
    let cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);

    let select = !!((Math.random() * 2) >> 0);

    if(io.TXTurbo_time > 5){
        if (select) {
            io.taixiu_turbo.taixiu.red_tai += cuoc;
            io.taixiu_turbo.taixiu.red_player_tai += 1;
        } else {
            io.taixiu_turbo.taixiu.red_xiu += cuoc;
            io.taixiu_turbo.taixiu.red_player_xiu += 1;
        }
    
        TXTurboCuoc.create({ uid: bot.id, name: bot.name, phien: io.TXTurbo_phien, bet: cuoc, taixiu: true, select: select, red: true, time: new Date() });

        var update = {bet : cuoc};

        let create = { uid: bot.id, phien: io.TXTurbo_phien, red: true, taixiu: true, select: select, time: new Date() };
        
        TXTurboCuocOne.updateOne(
			{ uid: bot.id, phien: io.TXTurbo_phien, red: true },
			{ $inc: update, $setOnInsert: create },
			{ upsert: true, setDefaultsOnInsert: true },
			function (err, doc) {
				if (err) {
					logger.logError(err);
					console.log(err);
				}
			});
    
        var self = this;
        self.cuocTX = cuoc;   
    }
};