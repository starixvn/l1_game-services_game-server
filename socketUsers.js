
let validator = require('validator');
let User = require('./app/Models/Users');
let helpers = require('./app/Helpers/Helpers');
let socket = require('./app/socket.js');
let captcha = require('./captcha');
let forgotpass = require('./app/Controllers/user/for_got_pass');
let userSessionManager = require('./app/web/user_session_manager');
let logger = require('./app/web/logger').getLogger();
const UserSessions = require('./app/Models/UserSessions');
const appConfigs = require('./config/appConfigs');

// Authenticate!
let authenticate = function (client, data, callback) {
	if (!!data && !!data.username && (!!data.password || data.autoLogin)) {
		let username = '' + data.username + '';
		let password = data.password;
		let register = !!data.register;
		let az09 = new RegExp('^[a-zA-Z0-9_]+$');
		let testName = az09.test(username);

		if (!!data.password && appConfigs.disabledDirectLogin) {
			register && client.c_captcha('signUp');
			callback({ title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Chức năng Đăng Nhập không hỗ trợ.' }, false)
		}
		else if (!validator.isLength(username, { min: 3, max: 32 })) {
			register && client.c_captcha('signUp');
			callback({ title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Tài khoản (3-32 kí tự).' }, false);
		} else if (!data.autoLogin && !validator.isLength(password, { min: 6, max: 32 })) {
			register && client.c_captcha('signUp');
			callback({ title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Mật khẩu (6-32 kí tự)' }, false);
		} else if (!testName) {
			register && client.c_captcha('signUp');
			callback({ title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Tên đăng nhập chỉ gồm kí tự và số !!' }, false);
		} else if (username == password) {
			register && client.c_captcha('signUp');
			callback({ title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Tài khoản không được trùng với mật khẩu!!' }, false);
		} else {
			try {
				username = username.toLowerCase();
				// Đăng Ký
				if (register) {
					if (!data.captcha || !client.c_captcha || !validator.isLength(data.captcha, { min: 4, max: 4 })) {
						client.c_captcha('signUp');
						callback({ title: 'ĐĂNG KÝ', text: 'Captcha không tồn tại.' }, false);
					} else {
						let checkCaptcha = new RegExp('^' + client.captcha + '$', 'i');
						checkCaptcha = checkCaptcha.test(data.captcha);
						if (checkCaptcha) {
							User.findOne({ 'local.username': username }).exec(function (err, check) {
								if (!!check) {
									client.c_captcha('signUp');
									callback({ title: 'ĐĂNG KÝ', text: 'Tên tài khoản đã tồn tại !!' }, false);
								} else {
									User.create({ 'local.username': username, 'local.password': helpers.generateHash(password), 'local.regDate': new Date() }, function (err, user) {
										if (!!user) {
											client.UID = user._id.toString();
											callback(false, true);
										} else {
											client.c_captcha('signUp');
											callback({ title: 'ĐĂNG KÝ', text: 'Tên tài khoản đã tồn tại !!' }, false);
										}
									});
								}
							});
						} else {
							client.c_captcha('signUp');
							callback({ title: 'ĐĂNG KÝ', text: 'Captcha không đúng.' }, false);
						}
					}
				} else {
					// Đăng Nhập
					User.findOne({ 'local.username': username }, function (err, user) {
						if (user) {
							// Ricky: check password or sso
							if (data.autoLogin || user.validPassword(password)) {
								client.UID = user._id.toString();
								callback(false, true);
							} else {
								callback({ title: 'ĐĂNG NHẬP', text: 'Sai mật khẩu.' }, false);
							}
						} else {
							logger.log(`Account not found at ${new Date()} Info: ${JSON.stringify(data)}`);
							callback({ title: 'ĐĂNG NHẬP', text: 'Tài khoản không tồn tại.' }, false);
						}
					});
				}
			} catch (error) {
				callback({ title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại.' }, false);
			}
		}
	}
};

const onRecheckin = function (session) {
	if (session && session.sessionId) {
		const sessionId = session.sessionId;
		UserSessions.findOneAndUpdate({ sessionId: sessionId }, { $set: { recheckInTime: new Date(), isOnline: true } }).exec();
	}
}

module.exports = function (ws, redT, req) {
	ws.auth = false;
	ws.UID = null;
	ws.captcha = {};
	ws.c_captcha = captcha;
	ws.red = function (data) {
		try {
			this.readyState == 1 && this.send(JSON.stringify(data));
		} catch (err) { }
	}
	socket.signMethod(ws);

	ws.on('message', async function (message) {
		try {
			if (!!message) {
				message = JSON.parse(message);
				if (!!message.captcha) {
					this.c_captcha(message.captcha);
				}
				if (!!message.forgotpass) {
					forgotpass(this, message.forgotpass);
				}
				if (this.auth == false && !!message.authentication) {

					if (message.authentication
						&& message.authentication.data
						&& message.authentication.data.ss) {
						let verifyResult = await userSessionManager.verifyUserSession(
							message.authentication.data.ss,
							message.authentication.data.username
						);
						if (verifyResult.userSession) {
							ws.session = verifyResult.userSession;
							message.session = verifyResult.userSession;

							if (!verifyResult.isAuthenticated) {
								this.red({ unauth: { message: 'Authentication failure', isSessionExpired: true } });
								return;
							}
							else {
								message.authentication.autoLogin = true;
							}
						}
					}
					else if (message.authentication && !message.authentication.password) {
						this.red({ unauth: { message: 'Authentication failure', noPassword: true } });
					}

					authenticate(this, message.authentication, async function (err, success) {
						if (success) {
							this.auth = true;
							this.redT = redT;
							this.username = message.authentication.username;
							if (!ws.session) {
								let userSessionData = await userSessionManager.initUserSessionWithSignInFlow(message.authentication.username);
								ws.session = userSessionData.userSession;
								this.ss = userSessionData.userSessionIdEncrypted;
							}

							socket.auth(this);
						} else if (!!err) {
							this.red({ unauth: err });
							//this.close();
						} else {
							this.red({ unauth: { message: 'Authentication failure' } });
							//this.close();
						}
					}.bind(this));
				} else if (!!this.auth) {
					message.session = ws.session;

					if (message.reCheckin) {
						onRecheckin(ws.session);
					}

					socket.message(this, message);
				}
				else {
					this.red({ removeIsLoading: true })
				}

			}
		} catch (error) {
			logger.logError(error);
		}
	});

	ws.on('close', function (message) {
		try {
			if (this.UID !== null && void 0 !== this.redT.users[this.UID]) {
				if (this.redT.users[this.UID].length === 1 && this.redT.users[this.UID][0] === this) {
					delete this.redT.users[this.UID];
				} else {
					var self = this;
					this.redT.users[this.UID].forEach(function (obj, index) {
						if (obj === self) {
							self.redT.users[self.UID].splice(index, 1);
						}
					});
				}
			}
			this.auth = false;
			void 0 !== this.TTClear && this.TTClear();
		} catch (ex) {
			logger.logError(ex);
		}
	});
}
