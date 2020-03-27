
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let XocXoc_phien = require('../../../Models/XocXoc/XocXoc_phien');
const logger = require('../../../web/logger');

module.exports = function (client, data) {
	if (!!data.page) {
		let red = !!data.red;
		let page = data.page >> 0;
		if (page > 0) {
			let kmess = 8;
			XocXoc_cuoc.countDocuments({ uid: client.UID, red: red, thanhtoan: true }).exec(function (err, total) {
				if (err) {
					logger.logError(err);
				}

				XocXoc_cuoc.find({ uid: client.UID, red: red, thanhtoan: true }, {}, { sort: { '_id': -1 }, skip: (page - 1) * kmess, limit: kmess }, function (err, result) {
					if (err) {
						logger.logError(err);
					}

					if (result.length) {
						Promise.all(result.map(function (obj) {
							obj = obj._doc;
							var getPhien = XocXoc_phien.findOne({ id: obj.phien }).exec();

							return new Promise((ra, loi) => {
								XocXoc_phien.findOne({ id: obj.phien }).exec(function (err, dataPhien) {
									if (err) {
										logger.logError(err);
									}

									if (dataPhien) {
										obj.kq = [dataPhien.red1, dataPhien.red2, dataPhien.red3, dataPhien.red4];
									}
									delete obj.__v;
									delete obj._id;
									delete obj.thanhtoan;
									delete obj.uid;
									delete obj.red;
									ra(obj);
								});
							}).then(values => {
								return values;
							});
						})).then(function (arrayOfResults) {
							client.red({ xocxoc: { history: { data: arrayOfResults, page: page, kmess: kmess, total: total } } });
						}).catch(function (err) {
							logger.logError(err);
						});
					} else {
						client.red({ xocxoc: { history: { data: [], page: page, kmess: kmess, total: 0 } } });
					}
				});
			})
		}
	}
};
