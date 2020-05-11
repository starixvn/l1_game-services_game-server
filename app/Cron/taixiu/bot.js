
let TXCuoc = require('../../Models/TaiXiu_cuoc');
let TXCuocOne = require('../../Models/TaiXiu_one');
let UserInfo = require('../../Models/UserInfo');
let Helper = require('../../Helpers/Helpers');

let tx = function (bot, io, maxBet, minBet) {
	let cuoc = Helper.getRandomNumberStep5(minBet, maxBet, false);

	let select = !!((Math.random() * 2) >> 0);

	if(io.TaiXiu_time > 5)
	{
		if (select) {
			io.taixiu.taixiu.red_tai += cuoc;
			io.taixiu.taixiu.red_player_tai += 1;
		} else {
			io.taixiu.taixiu.red_xiu += cuoc;
			io.taixiu.taixiu.red_player_xiu += 1;
		}
	
		TXCuocOne.create({ uid: bot.id, phien: io.TaiXiu_phien, taixiu: true, select: select, red: true, bet: cuoc });
		TXCuoc.create({ uid: bot.id, name: bot.name, phien: io.TaiXiu_phien, bet: cuoc, taixiu: true, select: select, red: true, time: new Date() });
		
		var self = this;
		self.cuocTX = cuoc;
	
		UserInfo.findOne({id: bot.id})
		.then(function(data){	
			if(data.red >= self.cuocTX)
			{
				data.red -= self.cuocTX;		
				data.save();
			}			
		});
	}

	bot = null;
	io = null;
	cuoc = null;
	select = null;
};

module.exports = {
	tx: tx
}
