
const BauCua     = require('../../../../Models/BauCua/BauCua_temp');
const BauCuaPhien     = require('../../../../Models/BauCua/BauCua_phien');
const dataBauCua = require('../../../../../data/baucua.json');

module.exports = function(client) {
	BauCua.findOne({}, {}, function(err, data) 
	{
		client.red({
			baucua:{dices: [dataBauCua[0], dataBauCua[1], dataBauCua[2]], red: data.red, xu: data.xu, time_remain: client.redT.BauCua_time}});	
			
	});

	BauCuaPhien.findOne({}, ['id', 'dice1', 'dice2', 'dice3'], {sort:{'id':-1}}, function(err, last) {
		if (last !== null)
		{
			client.red({baucua:
				{
					phien: last.id + 1,
					dices: [last.dice1, last.dice2, last.dice3]
				}});
		}
	});
}
