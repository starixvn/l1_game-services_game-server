let UserInfo = require('../../Models/UserInfo');
const logger = require('../../web/logger');
const helper = require('../../Helpers/Helpers');
let BCStopBetTime = 5;

module.exports = function (bot, io, maxBet, minBet) {
	let boxIndex = (Math.random() * 6) >> 0;
	let totalCuoc =  helper.getRandomNumberStep5(minBet, maxBet, true);

	if(io.BauCua_time > BCStopBetTime){
		UserInfo.findOne({ id: bot.id }, "red", function (err, user) {

			if(err)
			{
				logger.logError(err);
			}
	
			try
			{
				if (user && user.red >= totalCuoc) {
					user.red -= totalCuoc;
					user.save();
	
					if (boxIndex == 0) {
						io.baucua.info.redHuou += totalCuoc;
					} else if (boxIndex == 1) {
						io.baucua.info.redBau += totalCuoc;
					} else if (boxIndex == 2) {
						io.baucua.info.redGa += totalCuoc;
					} else if (boxIndex == 3) {
						io.baucua.info.redCa += totalCuoc;
					} else if (boxIndex == 4) {
						io.baucua.info.redCua += totalCuoc;
					} else if (boxIndex == 5) {
						io.baucua.info.redTom += totalCuoc;
					}
					
					bot = null;
					io = null;
					userCuoc = null;
				}
			}catch(err)
			{
				logger.logError(err);
			}
		});	
	}
}