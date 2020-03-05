let XocXocCuoc = require("../../Models/XocXoc/XocXoc_cuoc");

let random = function(){
	let a = (Math.random()*35)>>0;
	if (a == 34) {
		// 34
		return (Math.floor(Math.random()*(50-20+1))+20)*100000;
	}else if (a >= 32 && a < 34) {
		// 32 33
		return (Math.floor(Math.random()*(30-20+1))+20)*100000;
	}else if (a >= 30 && a < 32) {
		// 30 31 32
		return (Math.floor(Math.random()*(20-10+1))+10)*100000;
	}else if (a >= 26 && a < 30) {
		// 26 27 28 29
		return (Math.floor(Math.random()*(15-5+1))+5)*100000;
	}else if (a >= 21 && a < 26) {
		// 21 22 23 24 25
		return (Math.floor(Math.random()*(15-3+1))+3)*100000;
	}else if (a >= 15 && a < 21) {
		// 15 16 17 18 19 20
		return (Math.floor(Math.random()*(100-30+1))+30)*10000;
	}else if (a >= 8 && a < 15) {
		// 8 9 10 11 12 13 14
		return (Math.floor(Math.random()*(50-20+1))+20)*10000;
	}else{
		// 0 1 2 3 4 5 6 7
		return (Math.floor(Math.random()*(30-20+1))+20)*10000;
	}
};

module.exports = function(bot, io){
	let cuoc= random();
	let userCuoc =(Math.random()*6)>>0;
};