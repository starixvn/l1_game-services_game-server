
const axios = require('axios');
let User = require('../Models/Users');
let helpers = require('../Helpers/Helpers');
var cors = require('cors');
const userSessionManager = require('./user_session_manager');

var whitelist = ['http://localhost:7456', 'http://minigame.luminetsoft.com']
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
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
    app.get('/cc', cors(corsOptions), (req, res) => {
        res.send("ok");
    });

    app.get('/authenticate', cors(corsOptions), runAsyncWrapper(async (req, res) => {
        try {
            let verifyParams = {
                browserUserAgent: req.useragent.source,
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                token: req.query.token
            }
            var response = await axios.post('http://api.lumigame.com/AuthVerification/verify',
                //var response = await axios.post('http://localhost:8868/AuthVerification/verify',
                verifyParams);

            const data = response.data;

            if (data && data.isSuccessful) {
                let user = await User.findOne({ 'local.username': data.memberKey });

                if (!user) {
                    user = await User.create({
                        'local.username': data.memberKey,
                        'local.password': helpers.generateHash(data.memberKey + '!@#QWE'),
                        'local.regDate': new Date(),
                        'local.memberId': data.memberId,
                        'local.memberName': data.memberName,
                        'local.siteId': data.siteId,
                        'local.language': data.language,
                        'local.memberBalance': data.memberBalance,
                        'local.currency': data.currency
                    });
                }

                let userSessionIdEncrypted = await userSessionManager.initUserSession(data, verifyParams);

                res.send({ isAuthenticated: true, username: user.local.username, language: data.language, ss: userSessionIdEncrypted });
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