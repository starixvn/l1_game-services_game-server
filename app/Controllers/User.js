let User = require("../Models/Users");
let UserInfo = require("../Models/UserInfo");

// Game User
let TaiXiu_User = require("../Models/TaiXiu_user");
let BauCua_User = require("../Models/BauCua/BauCua_user");
let XocXoc_user = require("../Models/XocXoc/XocXoc_user");
let ChanLe_user = require("../Models/ChanLe/ChanLe_user");

let validator = require("validator");
let Helper = require("../Helpers/Helpers");

let next_scene = require("./user/next_scene");

const balanceApi = require("./../apis/balanceApi");
const authApi = require("./../apis/authApi");
const sessionManager = require("./../web/user_session_manager");
const logger = require("./../web/logger");
const configs = require("./../../config/appConfigs");
const baccaratPlayerHandler = require("./game/baccarat/player-handler");

let first = function (client) {
  UserInfo.findOne({ id: client.UID }, "-_id name red xu UID avatarId currency")
    .lean()
    .then((user) => {
      if (!!user) {
        client.profile = { name: user.name };

        user.ss = {
          isAuthenticated: true,
          username: client.username,
          language: client.session ? client.session.language : "",
          ss: client.session ? sessionManager.generatedEncryptedSessionId(client.session.sessionId) : "",
          isSSO: !!client.session.ssoToken,
          time: new Date(),
        };

        let data = {
          Authorized: true,
          user: user,
        };

        addToListOnline(client);

        if (!!user.currency) {
          client.session.characterName = user.name;
          authApi.notifyLogin(client, client.session, { characterName: user.name, firstLogin: false });

          balanceApi.getBalance(
            { id: client.UID },
            client,
            (userInfo) => {
              data.user.red = userInfo.red;
              client.red(data);
            },
            true
          );
        } else {
          client.red(data);
        }
      } else {
        client.red({ Authorized: false });
      }
    })
    .catch((err) => {
      logger.logError(err);
    });
};

let updateCoint = function (client) {
  balanceApi.getBalance({ id: client.UID }, client, (user) => {
    if (!!user) {
      client.red({ user: { red: user.red, currency: user.currency } });
    }
  });
};

let signName = function (client, name) {
  if (!!name) {
    name = "" + name + "";
    let az09 = new RegExp("^[a-zA-Z0-9]+$");
    let testName = az09.test(name);

    if (!validator.isLength(name, { min: 3, max: 14 })) {
      client.red({ notice: { title: "TÊN NHÂN VẬT", text: "Độ dài từ 3 đến 14 ký tự !!" } });
    } else if (!testName) {
      client.red({ notice: { title: "TÊN NHÂN VẬT", text: "Tên không chứa ký tự đặc biệt !!" } });
    } else {
      UserInfo.findOne({ id: client.UID }, "name red UID joinedOn")
        .lean()
        .then((d) => {
          if (!d) {
            User.findOne({ _id: client.UID })
              .lean()
              .then((base) => {
                var regex = new RegExp("^" + base.local.username + "$", "i");
                var testBase = regex.test(name);
                if (testBase) {
                  client.red({ notice: { title: "TÊN NHÂN VẬT", text: "Tên nhân vật không được trùng với tên đăng nhập..." } });
                } else {
                  if (
                    configs.env == "UAT" &&
                    configs.prefixCharactorName &&
                    client.session &&
                    client.session.currency &&
                    client.session.currency.toUpperCase() === "UUS"
                  ) {
                    name = `${configs.prefixCharactorName}${name}`;
                  }

                  UserInfo.find({ name: name }, "name")
                    .collation({ locale: "en", strength: 2 })
                    .lean()
                    .then((check) => {
                      if (check && check.length > 0) {
                        client.red({ notice: { title: "TÊN NHÂN VẬT", text: "Tên nhân vật đã tồn tại..." } });
                      } else {
                        try {
                          // get latest UID
                          UserInfo.find(
                            {},
                            ["name", "UID"], // Columns to Return
                            {
                              skip: 0, // Starting Row
                              limit: 1, // Ending Row
                              sort: {
                                UID: -1, //Sort by UID DESC
                              },
                            }
                          )
                            .lean()
                            .then((data) => {
                              let latestUID = 1;

                              if (data != null && data.length > 0 && data[0].UID > 0) {
                                latestUID = data[0].UID + 1;
                              }

                              let userInfo = {
                                id: client.UID,
                                name: name,
                                joinedOn: new Date(),
                                currency: base.local.currency,
                                avatarId: (Math.random() * 40 + 1) >> 0,
                                UID: latestUID,
                              };

                              UserInfo.updateOne({ name: name }, { $setOnInsert: userInfo }, { upsert: true, setDefaultsOnInsert: true })
                                .then((insertedUser) => {
                                  if (insertedUser) {
                                    UserInfo.findOne({ name: name }, "-_id name red UID joinedOn")
                                      .lean()
                                      .then((user) => {
                                        addToListOnline(client);

                                        let data = {
                                          Authorized: true,
                                          user: user,
                                        };

                                        client.profile = { name: user.name };

                                        const gameUser = { uid: client.UID };

                                        TaiXiu_User.updateOne(
                                          gameUser,
                                          { $setOnInsert: gameUser },
                                          { upsert: true, setDefaultsOnInsert: true }
                                        ).exec();

                                        BauCua_User.updateOne(
                                          gameUser,
                                          { $setOnInsert: gameUser },
                                          { upsert: true, setDefaultsOnInsert: true }
                                        ).exec();

                                        XocXoc_user.updateOne(
                                          gameUser,
                                          { $setOnInsert: gameUser },
                                          { upsert: true, setDefaultsOnInsert: true }
                                        ).exec();

                                        ChanLe_user.updateOne(
                                          gameUser,
                                          { $setOnInsert: gameUser },
                                          { upsert: true, setDefaultsOnInsert: true }
                                        ).exec();

                                        if (!!base.local.currency) {
                                          client.session.characterName = name;
                                          authApi.notifyLogin(client, client.session, { characterName: name, firstLogin: true });

                                          balanceApi.getBalance(
                                            user,
                                            client,
                                            (userInfo) => {
                                              data.user.red = userInfo.red;
                                              client.red(data);
                                            },
                                            true
                                          );
                                        } else {
                                          client.red(data);
                                        }
                                      })
                                      .catch((errF) => {
                                        logger.logError(errF);
                                        client.red({ notice: { load: 0, title: "LỖI", text: "Tên nhân vật đã tồn tại." } });
                                      });
                                  }
                                })
                                .catch((err) => {
                                  logger.logError(err);
                                });
                            })
                            .catch((err) => {
                              logger.logError(err);
                            });
                        } catch (error) {
                          logger.logError(error);
                          client.red({ notice: { title: "TÊN NHÂN VẬT", text: "Tên nhân vật đã tồn tại..." } });
                        }
                      }
                    })
                    .catch((err) => {
                      logger.logError(err);
                    });
                }
              })
              .catch((err) => {
                logger.logError(err);
              });
          } else {
            first(client);
          }
        })
        .catch((err) => {
          logger.logError(err);
        });
    }
  }
};

let changePassword = function (client, data) {
  if (!!data && !!data.passOld && !!data.passNew && !!data.passNew2) {
    if (!validator.isLength(data.passOld, { min: 6, max: 32 })) {
      client.red({ notice: { title: "LỖI", text: "Độ dài mật khẩu từ 6 đến 32 ký tự !!" } });
    } else if (!validator.isLength(data.passNew, { min: 6, max: 32 })) {
      client.red({ notice: { title: "LỖI", text: "Độ dài mật khẩu từ 6 đến 32 ký tự !!" } });
    } else if (!validator.isLength(data.passNew2, { min: 6, max: 32 })) {
      client.red({ notice: { title: "LỖI", text: "Độ dài mật khẩu từ 6 đến 32 ký tự !!" } });
    } else if (data.passOld == data.passNew) {
      client.red({ notice: { title: "LỖI", text: "Mật khẩu mới không trùng với mật khẩu cũ.!!" } });
    } else if (data.passNew != data.passNew2) {
      client.red({ notice: { title: "LỖI", text: "Nhập lại mật khẩu không đúng.!!" } });
    } else {
      User.findOne({ _id: client.UID }, function (err, user) {
        if (!!user) {
          if (user.local.username == data.passNew) {
            client.red({ notice: { title: "LỖI", text: "Mật khẩu không được trùng với tên đăng nhập.!!" } });
          } else {
            if (Helper.validPassword(data.passOld, user.local.password)) {
              User.updateOne({ _id: client.UID }, { $set: { "local.password": Helper.generateHash(data.passNew) } }).exec();
              client.red({ notice: { load: 0, title: "THÀNH CÔNG", text: "Đổi mật khẩu thành công." } });
            } else {
              client.red({ notice: { load: 0, title: "THẤT BẠI", text: "Mật khẩu cũ không đúng." } });
            }
          }
        }
      });
    }
  }
};

function addToListOnline(client) {
  try {
    if (void 0 !== client.redT.users[client.UID]) {
      try {
        if (client.redT && client.redT.game) {
          let xocxoc = client.redT.game.xocxoc;

          if (xocxoc && (xocxoc.clients[client.UID] || xocxoc.players[client.UID])) {
            delete xocxoc.clients[client.UID];
            delete xocxoc.players[client.UID];

            Object.values(xocxoc.clients).forEach(function (user) {
              if (client !== user) {
                user.red({ xocxoc: { outgame: { playerId: client.UID } } });
              }
            });
          }

          let kenoProMax = client.redT.kenoPromax;
          if (kenoProMax && (kenoProMax.realPlayers[client.UID] || kenoProMax.players[client.UID])) {
            delete kenoProMax.realPlayers[client.UID];
            delete kenoProMax.players[client.UID];

            Object.values(kenoProMax.realPlayers).forEach(function (user) {
              if (client !== user) {
                user.red({ kenoProMax: { outgame: { playerId: client.UID } } });
              }
            });
          }

          baccaratPlayerHandler.removeOutRoomUser(client, client.UID);
        }
      } catch (error) {
        logger.logError(error);
      }

      client.redT.users[client.UID].forEach((cacheClient) => {
        cacheClient.red({ kickedOut: { message: "Tài khoản bị đăng xuất do có người khác đăng nhập vào tài khoản này." } });
        cacheClient.close();
      });
    }

    client.redT.users[client.UID] = [client];
  } catch (ex) {
    logger.logError(ex);
  }
}

function onData(client, data) {
  if (!!data) {
    if (!!data.doi_pass) {
      changePassword(client, data.doi_pass);
    }
    if (!!data.updateCoint) {
      updateCoint(client);
    }
  }
}

module.exports = {
  first: first,
  signName: signName,
  onData: onData,
  next_scene: next_scene,
  updateCoint: updateCoint,
};
