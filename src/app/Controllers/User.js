let UserInfo = require("../Models/UserInfo");
let next_scene = require("./user/next_scene");
const balanceApi = require("./../apis/balanceApi");
const logger = require("./../web/logger");

let first = async (client) => {
  const user = await UserInfo.findOne({ id: client.UID }, "-_id name red UID avatarId currency").lean().exec();
  if (user) {
    const userInfo = { ...user };
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
    balanceApi.getBetLimit(client, updateMemberStakeLevel);

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

const updateMemberStakeLevel = (result, client) => {
  const userStakeLevel = { minBet: result.minBet, maxBet: result.maxBet };
  client.red({ userStakeLevel });
};

const updateCoin = async (client) => {
  balanceApi.getBalance({ id: client.UID }, client, (user) => {
    if (!!user) {
      client.red({ user: { red: user.red } });
    }
  });
};

function addToListOnline(client) {
  try {
    if (!client.redT) {
      return;
    }

    if (client.redT.users[client.UID]) {
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
    if (!!data.updateCoin) {
      updateCoin(client);
    }
  }
}

module.exports = {
  first: first,
  onData: onData,
  next_scene: next_scene,
  updateCoin: updateCoin,
};
