
const axios = require('axios');
let User = require('../Models/Users');
let helpers = require('../Helpers/Helpers');
var cors = require('cors');

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
    app.get('/login', cors(corsOptions), (req, res) => {
        //Store session
        req.session.user = {
            email: "testing@demo.com",
            name: "testuser"
        };
        
        res.send({ isAuthenticated: true, username: "test01" });
    });

    app.get('/authenticate', cors(corsOptions), runAsyncWrapper(async (req, res) => {
        try {
            var response = await axios.post('http://api.lumigame.com/AuthVerification/verify', {
            //var response = await axios.post('http://localhost:8868/AuthVerification/verify', {
                browserUserAgent: req.useragent.source,
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                token: req.query.token
            });

            let data = response.data;

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
                        'local.memberBalance': data.memberBalance
                    });
                }

                req.session.user = {
                    username: user.local.username
                };

                res.send({ isAuthenticated: true, username: user.local.username, language: data.language });
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