const User = require('../Models/Users');
const helpers = require('../Helpers/Helpers');
const cors = require('cors');
const userSessionManager = require('./user_session_manager');
const appConfigs = require('../../config/appConfigs');
const authApi = require('./../apis/authApi');

const corsOptions = {
    origin: function (origin, callback) {
        if (appConfigs.corsUrls.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error(`Not allowed by CORS ${origin}`))
        }
    }
}

function runAsyncWrapper(callback) {
    return function (req, res, next) {
        callback(req, res, next)
            .catch(next)
    }
}

function initAuthentication(app) {
    app.get('/recheckin', cors(corsOptions), runAsyncWrapper(async (req, res) => {

    }));

    app.get('/authenticate', cors(corsOptions), runAsyncWrapper(async (req, res) => {
        try {
            const verifyParams = {
                browserUserAgent: req.useragent.source,
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                token: req.query.token
            }
            if (verifyParams.ip) {
                verifyParams.ip.replace('::ffff:', '');
            }
            const data = await authApi.verifyToken(verifyParams);

            if (data && data.isSuccessful) {
                data.memberKey = `${data.siteId}_${data.memberId}`;
                let user = await User.findOne({ 'local.username': data.memberKey });

                if (!user) {
                    user = await User.create({
                        'local.username': data.memberKey,
                        'local.password': helpers.generateHash(data.memberKey + '!@#QWE'),
                        'local.regDate': new Date(),
                        'local.memberId': data.memberId,
                        'local.memberName': data.memberName,
                        'local.siteId': data.siteId,
                        'local.currency': data.currency
                    });
                }

                data.userId = user.id;

                const userSession = await userSessionManager.initUserSession(data, verifyParams);

                res.send({ isAuthenticated: true, username: user.local.username, language: data.language, ss: userSession.userSessionIdEncrypted });
            }
            else {
                res.send({ isAuthenticated: false });
            }

        } catch (error) {
            console.error(error);

            res.send({ isAuthenticated: false, error: "Lỗi Đăng Nhập" });
        }
    }));
}

module.exports = initAuthentication;