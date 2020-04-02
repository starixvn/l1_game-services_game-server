
let fs = require('fs');
const XocXocPhien     = require('../../../../Models/XocXoc/XocXoc_phien');

module.exports = function(client) {
	fs.readFile('./data/xocxoc.json', 'utf8', (errcf, txtJson) => {
		try {
			txtJson = JSON.parse(txtJson);
			client.red({xocxoc:{dices:[txtJson.red1, txtJson.red2, txtJson.red3, txtJson.red4], time_remain: client.redT.game.xocxoc.time, ingame: client.redT.game.xocxoc.ingame, info: client.redT.game.xocxoc.dataAdmin}});
		} catch (error) {
			client.red({notice:{title:'THẤT BẠI', text:'Lỗi bất ngờ...'}});
		}
	});

	XocXocPhien.findOne({}, ['id', 'red1', 'red2', 'red3', 'red4'], {sort:{'id':-1}}, function(err, last) {
		if (last !== null)
		{
			client.red({xocxoc:
				{
					phien: last.id + 1,
					dices: [last.red1, last.red2, last.red3, last.red4]
				}});
		}
	});
}
