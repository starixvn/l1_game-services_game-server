
var BauCua_cuoc = require('../../../Models/BauCua/BauCua_cuoc');
var BauCua_phien = require('../../../Models/BauCua/BauCua_phien');
const logger = require('../../../web/logger');

module.exports = (clientId, red, page, kmess) => {
	return new Promise((resolve, reject) => {
		BauCua_cuoc.countDocuments({ uid: clientId, red: red, thanhtoan: true }).exec(function (err, total) {
			if (err) {
				logger.logError(err);
				reject();
				return;
			}
			BauCua_cuoc.find({ uid: clientId, red: red, thanhtoan: true }, {},
				{ sort: { '_id': -1 }, skip: (page - 1) * kmess, limit: kmess },
				function (err, result) {
					if (err) {
						logger.logError(err);
						reject();
						return;
					}
					if (result.length) {
						Promise.all(result.map(function (obj) {
							obj = obj._doc;
							var getPhien = BauCua_phien.findOne({ id: obj.phien }).exec();
							return Promise.all([getPhien])
								.then(values => {
									obj.kq = [values[0].dice1, values[0].dice2, values[0].dice3];
									delete obj.__v;
									delete obj._id;
									delete obj.thanhtoan;
									delete obj.uid;
									delete obj.red;
									return obj;
								})
								.catch(promiseErr => logger.logError(promiseErr));
						}))
							.then(function (arrayOfResults) {
								resolve({ data: arrayOfResults, page: page, kmess: kmess, total: total });
							})
							.catch(promiseErr => logger.logError(promiseErr));
					} else {
						resolve({ data: [], page: page, kmess: kmess, total: 0 });
					}
				});
		})
	});
}
