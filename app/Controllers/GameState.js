
module.exports = function(client){

	let GameConfigs  = require('../Models/GameConfig/GameConfigs');

	GameConfigs.findOne({name : "taixiu"})
	.then(function(data){
	 
	  var isEnabled = (!!data && data.enabled);

	  if(isEnabled)
	  {
		client.red({
			taixiu: {time_remain: client.redT.TaiXiu_time}
		});
	  }else
	  {
		client.red({
			taixiu: {um: true}
		});
	  }	  
	})
	.catch(function(err){
	  console.log("cannot get config for taixiu " + err);
	});

	GameConfigs.findOne({name : "baucua"})
	.then(function(data){
	 
	  var isEnabled = (!!data && data.enabled);

	  if(isEnabled)
	  {
		client.red({
			mini:   {baucua:{time_remain: client.redT.BauCua_time}}
		});
	  }else
	  {
		client.red({
			mini: {baucua:{um: true}}
		});
	  }	  
	})
	.catch(function(err){
	  console.log("cannot get config for baucua " + err);
	});
}
