
const validator = require('validator');
const User = require('./app/Models/Admin');
const socket = require('./app/Controllers/admin/socket.js');
const bcrypt  = require('bcrypt');
const appConfigs = require('./config/appConfigs');
const crypto = require('crypto');
const splice = require('buffer-splice');
const logger = require('./app/web/logger').getLogger();
const jwt = require('jsonwebtoken');
const privateKey =appConfigs.adminSecretKey;

// Authenticate!
const authenticate = function (client, data, callback) {

	//SSO
	if(!!data && !!data.token)
	{
		try{
			var tokens = data.token.split('-');

			if(tokens.length == 2)
			{
				var isMatched = bcrypt.compareSync(appConfigs.adminSecretKey, tokens[0]);
				if(isMatched)
				{
					var userHash = decrypt(tokens[1]);
					var userNamePass = userHash.split('-');
	
					User.findOne({ 'username': userNamePass[0] }, function (err, user) {
						if (user) {
							if (user.validPassword(userNamePass[1])) {
								client.UID = user._id.toString();
								callback(false, true);
							} else {
								callback({ title: 'ĐĂNG NHẬP', text: 'Sai mật khẩu.' }, false);
							}
						} else {
							callback({ title: 'ĐĂNG NHẬP', text: 'Tài khoản không tồn tại.' }, false);
						}
					});
				}else {
					callback({ title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại.' }, false);
				}
			}else {
				callback({ title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại.' }, false);
			}
		}catch(exception){
			console.log(exception);
			callback({ title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại.' }, false);
		}
	}

	if (!!data && !!data.username && !!data.password) {
		let username = '' + data.username + '';
		let password = data.password;
		let az09 = new RegExp('^[a-zA-Z0-9]+$');
		let testName = az09.test(username);

		if (!validator.isLength(username, { min: 3, max: 32 })) {
			callback({ title: 'ĐĂNG NHẬP', text: 'Tài khoản (3-32 kí tự).' }, false);
		} else if (!validator.isLength(password, { min: 5, max: 32 })) {
			callback({ title: 'ĐĂNG NHẬP', text: 'Mật khẩu (6-32 kí tự)' }, false);
		} else if (!testName) {
			callback({ title: 'ĐĂNG NHẬP', text: 'Tên đăng nhập chỉ gồm kí tự và số !!' }, false);
		} else {
			try {
				username = username.toLowerCase();
				User.findOne({ 'username': username }, function (err, user) {
					if (user) {
						if (user.validPassword(password)) {
							client.UID = user._id.toString();
							callback(false, true);
						} else {
							callback({ title: 'ĐĂNG NHẬP', text: 'Sai mật khẩu.' }, false);
						}
					} else {
						callback({ title: 'ĐĂNG NHẬP', text: 'Tài khoản không tồn tại.' }, false);
					}
				});
			} catch (error) {
				callback({ title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại.' }, false);
			}
		}
	}

	// JWT
	if (!!data && !!data.jwt) {
		try {
			const token = data.jwt;
			const {username} = jwt.verify(token, privateKey);

			client.UID = username;

			callback(false, true);
		} catch (e) {
			callback({ title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại.' }, false);
		}
	}
};

let decrypt =  function(encryptedText){
	algo = 'aes-128-cbc';
    keyBuffer = "!Qqs2SRXWER533FV";
	ivBuffer = "5TGBaYHOID5egIKA";

	var decipher = crypto.createDecipheriv(algo, keyBuffer, ivBuffer);
	var dec = decipher.update(encryptedText, 'base64', 'utf8');
	
	dec += decipher.final('utf8');

	var buffer = Buffer.from(dec, 'utf8');
	var formatBuffer = buffer;

	//Remove all leading zero
	while(formatBuffer.indexOf(0x00) > -1)
	{
		var i = formatBuffer.indexOf(0x00)
		var formatBuffer = splice(formatBuffer, i, 1);
	}

	return formatBuffer.toString('utf8');
}

module.exports = function (ws, redT) {
	ws.admin = true;
	ws.auth = false;
	ws.UID = null;

	ws.red = function (data) {
		try {
			this.readyState == 1 && this.send(JSON.stringify(data));
		} catch (err) {
			logger.logWarning(err);
		}
	}

	ws.on('message', function (message) {
		try {
			if (!!message) {
				message = JSON.parse(message);
				if (this.auth == false && !!message.authentication) {
					authenticate(this, message.authentication, function (err, success) {
						if (success) {
							ws.auth = true;
							ws.redT = redT;
							if (void 0 !== ws.redT.admins[ws.UID]) {
								ws.redT.admins[ws.UID].push(ws);
							} else {
								ws.redT.admins[ws.UID] = [ws];
							}
							socket.auth(ws);
						} else if (!!err) {
							ws.red({ unauth: err });
						} else {
							ws.red({ unauth: { message: 'Authentication failure' } });
						}
					});
				} else if (!!this.auth) {
					socket.message(this, message);
				}
			}
		} catch (error) {
			logger.logError(err);
		}
	});

	ws.on('close', function (message) {
		try{
			if (this.UID !== null && void 0 !== this.redT.admins[this.UID]) {
				if (this.redT.admins[this.UID].length === 1 && this.redT.admins[this.UID][0] === this) {
					delete this.redT.admins[this.UID];
					if (this.redT) {
						delete this.redT;
					}
				} else {
					var self = this;
					this.redT.admins[this.UID].forEach(function (obj, index) {
						if (obj === self) {
							self.redT.admins[self.UID].splice(index, 1);
							if (self.redT) {
								delete self.redT;
							}
						}
					});
				}
			}
			this.auth = false;

			logger.log("socketAdmin close " + message);
		}catch(err){
			logger.logWarning(err);
		}		
	});
}
