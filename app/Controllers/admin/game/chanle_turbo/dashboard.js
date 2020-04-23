const ChanLeTurbo_User = require('../../../../Models/ChanLeTurbo/ChanLeTurbo_user');
const UserInfo = require('../../../../Models/UserInfo');
const logger = require('../../../../web/logger');

function viewDashboard(client, red) {
	red = !!red;
	var waitCL_Win = new Promise((a, b) => { // Top 50 Dây thắng Chẵn lẻ hiện tại
		ChanLeTurbo_User.find(
			{},
			'uid cLineWinRed cLineWinRedH cLineWinXu cLineWinXuH',
			{
				sort: red ? { 'cLineWinRedH': -1 } : { 'cLineWinXuH': -1 },
				limit: 50
			},
			function (err, data) {

				if (err) {
					logger.logError(err);
				}

				Promise.all(data.map(function (obj) {
					try {

						obj = obj._doc;
						var getUser = UserInfo.findOne({ id: obj.uid }, 'name').exec();
						return Promise.all([getUser]).then(values => {
							Object.assign(obj, values[0]._doc);
							delete obj.__v;
							delete obj._id;
							delete obj.uid;
							return obj;
						});

					} catch (err) {
						logger.logError(err);
					}
				}))
					.then(function (arrayOfResults) {
						a(arrayOfResults);
					})
			});
	});
	var waitCL_Lost = new Promise((a, b) => { // Top 50 Dây Thua Chẵn lẻ hiện tại
		ChanLeTurbo_User.find(
			{},
			'uid cLineLostRed cLineLostRedH cLineLostXu cLineLostXuH',
			{
				sort: red ? { 'cLineLostRedH': -1 } : { 'cLineLostXuH': -1 },
				limit: 50
			},
			function (err, data) {

				if (err) {
					logger.logError(err);
				}

				Promise.all(data.map(function (obj) {
					try {
						obj = obj._doc;
						var getUser = UserInfo.findOne({ id: obj.uid }, 'name').exec();
						return Promise.all([getUser]).then(values => {
							Object.assign(obj, values[0]._doc);
							delete obj.__v;
							delete obj._id;
							delete obj.uid;
							return obj;
						});
					} catch (err) {
						logger.logError(err);
					}
				}))
					.then(function (arrayOfResults) {
						a(arrayOfResults);
					})
			});
	});
	Promise.all([waitCL_Win, waitCL_Lost])
		.then(values => {
			client.red({ clturbo: { dashboard: { dCLWin: values[0], dCLLost: values[1] } } });
		});
}

function get_top(client, data) {
	try {
		if (!!data && !!data.page && !!data.sort) {
			var red = !!data.red;
			var page = data.page >> 0;
			var sort = data.sort >> 0;
			var kmess = 10;

			if (page > 0) {
				// Project
				var project = { name: 1 };
				project.uid = '$uid';
				if (red) { // Red
					project.profitCL = { $subtract: ['$cWinRed', '$cLostRed'] };
					project.cWin = '$cWinRed';
					project.cLost = '$cLostRed';
				} else { // Xu
					project.profitCL = { $subtract: ['$cWinXu', '$cLostXu'] };
					project.cWin = '$cWinXu';
					project.cLost = '$cLostXu';
				}

				// sort
				var sort = {};

				if (data.sort == '1') {
					sort.cWin = -1;
				} else if (data.sort == '2') {
					sort.cWin = 1;


				} else if (data.sort == '3') {
					sort.cLost = -1;
				} else if (data.sort == '4') {
					sort.cLost = 1;
				}

				else if (data.sort == '5') {
					sort.profitCL = -1;
				} else if (data.sort == '6') {
					sort.profitCL = 1;
				}

				else {
					sort.profitCL = -1;
				}

				var filter = [
					{
						'$lookup': {
							'from': 'userinfos',
							'localField': 'uid',
							'foreignField': 'id',
							'as': 'users'
						}
					}, {
						'$replaceRoot': {
							'newRoot': {
								'$mergeObjects': [
									{
										'$arrayElemAt': [
											'$users', 0
										]
									}, '$$ROOT'
								]
							}
						}
					}, {
						'$match': {
							'type': false,
							'currency': {
								'$regex': new RegExp('^(?!uus?.).*$', 'i')
							}
						}
					}
				];
				// count total
				ChanLeTurbo_User.aggregate([
					...filter,
					{ $count: 'total' },
				]).exec(function (err, countFind) {
					if (err) {
						logger.logError(err);
					}
					ChanLeTurbo_User.aggregate([
						...filter,
						{ $project: project },
						{ $sort: sort },
						{ $skip: (page - 1) * kmess },
						{ $limit: kmess }
					]).exec(function (err, result) {
						if (err) {
							logger.logError(err);
						}

						if (result.length) {
							Promise.all(result.map(function (obj) {
								return new Promise(function (resolve, reject) {
									try {
										delete obj._id;
										delete obj.uid;
										resolve(obj);
									} catch (err) {
										logger.logError(err);
									}
								})
							}))
								.then(function (data) {
									client.red({ clturbo: { dashboard: { get_users: { data: data, page: page, kmess: kmess, total: countFind[0].total } } } });
								})
						} else {
							client.red({ clturbo: { dashboard: { get_users: { data: [], page: 1, kmess: 10, total: 0 } } } });
						}
					});
				});
			}
		}
	}
	catch (err) {
		logger.logError(err);
	}
}

module.exports = function (client, data) {
	if (void 0 !== data.view) {
		viewDashboard(client, data.view);
	}
	if (void 0 !== data.get_top) {
		get_top(client, data.get_top);
	}
}
