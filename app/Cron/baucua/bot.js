let BauCua_cuoc = require('../../Models/BauCua/BauCua_cuoc');
let UserInfo = require('../../Models/UserInfo');
const logger = require('../../web/logger');
const helper = require('../../Helpers/Helpers');

/**
 * Ngẫu nhiên cược
 * return {number}
 */
let random = function () {
	let a = (Math.random() * 35) >> 0;
	if (a == 34) {
		// 34
		// return (Math.floor(Math.random()*(50-45+1))+45)*10000;
		return (Math.floor(Math.random() * (50 - 45 + 1)) + 45);
	} else if (a >= 32 && a < 34) {
		// 32 33
		// return (Math.floor(Math.random()*(45-10+1))+10)*10000;
		return (Math.floor(Math.random() * (45 - 10 + 1)) + 10);
	} else if (a >= 30 && a < 32) {
		// 30 31 32
		// return (Math.floor(Math.random()*(100-20+1))+20)*1000;
		return (Math.floor(Math.random() * (100 - 20 + 1)) + 20);
	} else if (a >= 26 && a < 30) {
		// 26 27 28 29
		// return (Math.floor(Math.random()*(50-10+1))+10)*1000;
		return (Math.floor(Math.random() * (50 - 10 + 1)) + 10);
	} else if (a >= 21 && a < 26) {
		// 21 22 23 24 25
		// return (Math.floor(Math.random()*(20-1+1))+1)*1000;
		return (Math.floor(Math.random() * (20 - 1 + 1)) + 1);
	} else if (a >= 15 && a < 21) {
		// 15 16 17 18 19 20
		// return (Math.floor(Math.random()*(20-1+1))+1)*1000;
		return (Math.floor(Math.random() * (20 - 1 + 1)) + 1);
	} else if (a >= 8 && a < 15) {
		// 8 9 10 11 12 13 14
		// return (Math.floor(Math.random()*(10-1+1))+1)*1000;
		return (Math.floor(Math.random() * (10 - 1 + 1)) + 1);
	} else {
		// 0 1 2 3 4 5 6 7
		// return (Math.floor(Math.random()*(10-1+1))+1)*1000;
		return (Math.floor(Math.random() * (10 - 1 + 1)) + 1);
	}
};

/**
 * Cược
 */

// Bầu cua RED
module.exports = function (bot, io, maxBet) {
	let boxIndex = (Math.random() * 6) >> 0;
	let totalCuoc =  helper.getRandomNumberStep5(maxBet);

	// let botBets = helper.getRandomChips(totalCuoc);

	BauCua_cuoc.findOne({ uid: bot.id, phien: io.BauCua_phien, red: true }, function (err, checkOne) {

		if(err)
		{
			logger.logError(err);
		}

		if (!checkOne || (checkOne[0] + checkOne[1] + checkOne[2] + checkOne[3] + checkOne[4] + checkOne[5] + cuoc))
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
	
						if (checkOne) {
							checkOne[boxIndex] += totalCuoc;
							checkOne.save();
						} else {
							var update = {};
							update[boxIndex] = totalCuoc;

							let create = { uid: bot.id, name: bot.name, phien: io.BauCua_phien, red: true, time: new Date() };
							// BauCua_cuoc.create(create);
							// console.log("BC bot " + bot.id + " round: " + io.BauCua_phien + " bet: " + totalCuoc);

							BauCua_cuoc.updateOne(
								{ uid: bot.id, name: bot.name, phien: io.BauCua_phien, red: true }, 
								{ $inc: update, $setOnInsert: create }, 
								{ upsert: true }, 
								function (err, doc) {
									if (err) {
										logger.logError(err);
									}
							});
						}
	
						// //notify all user about chip cuoc
						// Object.values(io.users).forEach(function (users) {
						// 	users.forEach(obj => {
						// 		var dataT = {
						// 			mini: {
						// 				baucua: {
						// 					chipCuoc: {
						// 						chip: cuoc,
						// 						linhvat: userCuoc,
						// 						ownChip: false
						// 					}
						// 				}
						// 			},
						// 		};
						// 		obj.red(dataT)
						// 	});
						// });
						bot = null;
						io = null;
						create = null;
						cuoc = null;
						userCuoc = null;
					}
				}catch(err)
				{
					logger.logError(err);
				}
			});
	})
}