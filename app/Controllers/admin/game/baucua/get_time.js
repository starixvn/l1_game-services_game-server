const BauCuaPhien     = require('../../../../Models/BauCua/BauCua_phien');

module.exports = function(client) {
    BauCuaPhien.findOne({}, 'id', {sort:{'id':-1}}, function(err, last) {
        if (last !== null)
        {
            client.red({baucua:
                {
                    phien: last.id+1, 
                    time_remain: client.redT.BauCua_time
                }});
		}
	})
}