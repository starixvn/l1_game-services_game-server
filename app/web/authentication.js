
const axios = require('axios');
const randomstring = require("randomstring");

function runAsyncWrapper (callback) {
    return function (req, res, next) {
      callback(req, res, next)
        .catch(next)
    }
  }

function initAuthentication(app) {
    app.get('/login', (req, res) => {
        req.session.user = {
            email: "testing@demo.com",
            name: "testuser" + randomstring.generate()
        };
        res.send("login ok");
    });

    app.get('/showuser', (req, res) => {
        res.send(req.session.user);
    });

    app.get('/authenticate', runAsyncWrapper( async (req, res)  => {
        let response = "";

        try {
            response = await axios.get('https://www.google.com/');
            console.log(response.data);
        } catch (error) {
            console.error(error);
            return next(error);
        }

        let userInfo = {
            userAgent: req.useragent,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            query: req.query,
            response: response.data
        }

        res.send(userInfo);
    }));

    app.get("/destination", (req, res) => {
        let userInfo = {
            userAgent: req.useragent,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            query: req.query
        }

        res.send(userInfo);
    })
}

module.exports = initAuthentication;