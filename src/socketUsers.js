const User = require("./app/Models/Users");
const socket = require("./app/socket.js");
const userSessionManager = require("./app/web/user_session_manager");
const logger = require("./app/web/logger").getLogger();
const UserSessions = require("./app/Models/UserSessions");
const underMaintenanceHandler = require("./app/Controllers/UnderMaintenance");
const PartnerConfig = require("./app/Controllers/partner-config");

// Authenticate!
const authenticate = function (client, data, callback) {
  if (!!data && !!data.username && (!!data.password || data.autoLogin)) {
    let username = "" + data.username + "";

    try {
      username = username.toLowerCase();
      User.findOne({ "local.username": username }, function (err, user) {
        if (err) {
          logger.logError(err);
        }

        if (user && data.autoLogin) {
          client.UID = user._id.toString();
          callback(false, true);
        } else {
          logger.log(`Account not found at ${new Date()} Info: ${JSON.stringify(data)}`);
          callback({ title: "ĐĂNG NHẬP", text: "Tài khoản không tồn tại." }, false);
        }
      });
    } catch (error) {
      callback({ title: "THÔNG BÁO", text: "Có lỗi xảy ra, vui lòng kiểm tra lại." }, false);
    }
  }
};

const onRecheckin = function (session) {
  if (session && session.sessionId) {
    const sessionId = session.sessionId;
    UserSessions.findOneAndUpdate({ sessionId: sessionId }, { $set: { recheckInTime: new Date() } }).exec();
  }
};

const isUm = async function (session, client) {
  try {
    const umInfo = underMaintenanceHandler.getUmInfoByPartnerId(session.partnerId);
    const isSuperPlayers = await PartnerConfig.isSuperPlayers(session.memberName, session.partnerId);

    if (umInfo && !isSuperPlayers) {
      underMaintenanceHandler.forceClosedConnection(client);
      return true;
    }
  } catch (err) {
    logger.logError(err);
  }

  return false;
};

module.exports = function (ws, redT, req) {
  ws.auth = false;
  ws.UID = null;
  ws.red = function (data) {
    try {
      this.readyState == 1 && this.send(JSON.stringify(data));
    } catch (err) {}
  };
  ws.clientUserAgent = req.useragent ? req.useragent.source : "";
  socket.signMethod(ws);

  ws.on("message", async function (message) {
    try {
      if (!!message) {
        message = JSON.parse(message);

        if (this.auth === false && message.authentication && message.authentication.data && message.authentication.data.ss) {
          let verifyResult = await userSessionManager.verifyUserSession(
            message.authentication.data.ss,
            message.authentication.data.username,
            ws.clientUserAgent
          );

          if (verifyResult.userSession) {
            ws.session = verifyResult.userSession;
            message.session = verifyResult.userSession;

            if (!verifyResult.isAuthenticated) {
              this.red({ unauth: { message: "Authentication failure", isSessionExpired: true } });
              return;
            } else {
              message.authentication.autoLogin = true;
            }
          }

          authenticate(
            this,
            message.authentication,
            async function (err, success) {
              if (success) {
                this.auth = true;
                this.redT = redT;
                this.username = message.authentication.username;
                if (!ws.session) {
                  let userSession = await userSessionManager.initUserSessionWithSignInFlow(message.authentication.username);
                  ws.session = userSession;
                  this.ss = userSession.sessionId;
                }

                if (await isUm(ws.session, this)) {
                  return;
                }

                await socket.auth(this);
              } else if (!!err) {
                this.red({ unauth: err });
              } else {
                this.red({ unauth: { message: "Authentication failure" } });
              }
            }.bind(this)
          );
        } else if (!!this.auth) {
          message.session = ws.session;

          if (await isUm(ws.session, this)) {
            return;
          }

          if (message.reCheckin) {
            onRecheckin(ws.session);
          }

          socket.message(this, message);
        } else {
          this.red({ removeIsLoading: true });
        }
      }
    } catch (error) {
      logger.logError(error);
    }
  });

  ws.on("close", function (message) {
    try {
      if (this.UID !== null && void 0 !== this.redT.users[this.UID]) {
        if (this.redT.users[this.UID].length === 1 && this.redT.users[this.UID][0] === this) {
          delete this.redT.users[this.UID];
        } else {
          const self = this;
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
};
