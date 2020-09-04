let User = require("../Models/Users");
let UserInfo = require("../Models/UserInfo");

let validator = require("validator");
let Helper = require("../Helpers/Helpers");

let next_scene = require("./user/next_scene");

const balanceApi = require("./../apis/balanceApi");
const authApi = require("./../apis/authApi");
const logger = require("./../web/logger");
const configs = require("./../../config/appConfigs");
const baccaratPlayerHandler = require("./game/baccarat/player-handler");
const removeRoulettePlayerOutOfRoom = require("./game/Roulette/out-game");
const getSpins = require("./game/LuckyWheel/get-spins");

const CreateCharacterNameErrors = {
  invalidLength: "Độ dài từ 3 đến 14 ký tự !!",
  invalidChars: "Tên không chứa ký tự đặc biệt !!",
  sameWithUserName: "Tên nhân vật không được trùng với tên đăng nhập...",
  existCharacterName: "Tên nhân vật đã tồn tại...",
};

let first = async (client) => {
  const user = await UserInfo.findOne({ id: client.UID }, "-_id name red UID avatarId currency scoins").lean().exec();
  if (user) {
    const availSpins = (await getSpins(client.session.memberId))?.availSpins;
    const userInfo = { ...user, availSpins };
    generateUserSessionAndAddToListOnline(client, userInfo);
  } else {
    client.red({ Authorized: false });
  }
};

const generateUserSessionAndAddToListOnline = (client, user) => {
  client.profile = { name: user.name };

  user.ss = {
    isAuthenticated: true,
    username: client.username,
    language: client.session ? client.session.language : "",
    ss: client.session ? client.session.sessionId : "",
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
};

const updateCoin = async (client) => {
  const availSpins = (await getSpins(client.session.memberId))?.availSpins;

  balanceApi.getBalance({ id: client.UID }, client, (user) => {
    if (!!user) {
      UserInfo.findOne({ id: client.UID }, "-_id scoins", (err, res) => {
        client.red({ user: { red: user.red, scoins: res?.scoins ?? 0, availSpins: availSpins ?? 0 } });
      });
    }
  });
};

let signName = (client, name) =>
  createCharacterName(client, name).catch((error) => {
    logger.logError(error);
    client.red({ notice: { title: "TÊN NHÂN VẬT", text: CreateCharacterNameErrors.existCharacterName } });
  });

const createCharacterName = async (client, name) => {
  name = "" + name + "";

  if (validateCharacterName(client, name)) {
    const registeredUser = await User.findOne({ _id: client.UID }).lean().exec();

    if (registeredUser.local.username.toUpperCase() === name.toUpperCase()) {
      client.red({ notice: { title: "TÊN NHÂN VẬT", text: CreateCharacterNameErrors.sameWithUserName } });
      return;
    }

    const d = await UserInfo.findOne({ id: client.UID }, "-_id name red UID avatarId currency").lean().exec();

    if (d) {
      generateUserSessionAndAddToListOnline(client, d);
      return;
    }

    name = `${generateCharNamePrefix(configs, client.session)}${name}`;

    if (await isExistingCharacterName(name)) {
      client.red({ notice: { title: "TÊN NHÂN VẬT", text: CreateCharacterNameErrors.existCharacterName } });

      return;
    }

    // get latest UID
    const latestUID = await getLatestUserInfoUID();
    const availSpins = (await getSpins(client.session.memberId))?.availSpins;

    let userInfo = {
      id: client.UID,
      name: name,
      joinedOn: new Date(),
      currency: registeredUser.local.currency,
      avatarId: (Math.random() * 40 + 1) >> 0,
      UID: latestUID,
    };

    const insertedUser = await UserInfo.updateOne(
      { name: name },
      { $setOnInsert: userInfo },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec();

    if (!insertedUser || insertedUser?.upserted?.length == 0) {
      client.red({ notice: { title: "LỖI", text: CreateCharacterNameErrors.existCharacterName } });
      return;
    }

    addToListOnline(client);

    delete userInfo.id;

    let data = {
      Authorized: true,
      user: { ...userInfo, availSpins: availSpins ?? 0 },
    };

    client.profile = { name: userInfo.name };

    if (!!registeredUser.local.currency) {
      client.session.characterName = name;
      authApi.notifyLogin(client, client.session, { characterName: name, firstLogin: true });

      balanceApi.getBalance(
        userInfo,
        client,
        (user) => {
          data.user.red = user.red;
          client.red(data);
        },
        true
      );
    } else {
      client.red(data);
    }
  }
};

const validateCharacterName = (client, name) => {
  const az09 = new RegExp("^[a-zA-Z0-9]+$");

  const criteria = [
    {
      failure: !name,
      notice: CreateCharacterNameErrors.invalidLength,
    },
    {
      failure: !validator.isLength(name, { min: 3, max: 14 }),
      notice: CreateCharacterNameErrors.invalidLength,
    },
    {
      failure: !az09.test(name),
      notice: CreateCharacterNameErrors.invalidChars,
    },
  ];

  const failedCriterion = criteria.find((criterion) => criterion.failure);

  if (failedCriterion) {
    client.red({ notice: { title: "TÊN NHÂN VẬT", text: failedCriterion.notice } });
    return false;
  }

  return true;
};

const getLatestUserInfoUID = async () => {
  let userInfoList = await UserInfo.find(
    {},
    ["UID"], // Columns to Return
    {
      skip: 0, // Starting Row
      limit: 1, // Ending Row
      sort: {
        UID: -1, //Sort by UID DESC
      },
    }
  )
    .lean()
    .exec();

  if (userInfoList != null && userInfoList.length > 0 && userInfoList[0].UID > 0) {
    return userInfoList[0].UID + 1;
  }

  return 1;
};

const isExistingCharacterName = async (name) => {
  const exist = await UserInfo.findOne({ name: name }).select({ _id: 1 }).collation({ locale: "en", strength: 2 }).lean().exec();

  return exist != null;
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
          // let xocxoc = client.redT.game.xocxoc;

          // if (xocxoc && (xocxoc.clients[client.UID] || xocxoc.players[client.UID])) {
          //   delete xocxoc.clients[client.UID];
          //   delete xocxoc.players[client.UID];

          //   Object.values(xocxoc.clients).forEach(function (user) {
          //     if (client !== user) {
          //       user.red({ xocxoc: { outgame: { playerId: client.UID } } });
          //     }
          //   });
          // }

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
          removeRoulettePlayerOutOfRoom(client, true);
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
    if (!!data.updateCoin) {
      updateCoin(client);
    }
  }
}

const generateCharNamePrefix = (configs, session) => {
  return configs.env == "UAT" && configs.prefixCharactorName && session && session.currency && session.currency.toUpperCase() === "UUS"
    ? configs.prefixCharactorName
    : "";
};

module.exports = {
  first: first,
  signName: signName,
  onData: onData,
  next_scene: next_scene,
  updateCoin: updateCoin,
};
