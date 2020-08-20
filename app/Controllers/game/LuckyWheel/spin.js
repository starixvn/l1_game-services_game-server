const UserSpin = require("./Models/Spin");
const UserInfo = require("../../../Models/UserInfo");
const SpinResult = require("./Models/Spin_Result");

let Chance = require("chance");
const chance = new Chance();

const Constants = require("./constants");
const Logger = require("../../../web/logger");
const getSpins = require("./get-spins");

const validateSpinRequest = async (player) => {
  const userSpin = await getSpins(player?.session?.memberId);

  try {
    const criteria = [
      {
        failure: userSpin.availSpins < 1,
        notice: Constants.notEnoughSpin,
      },
    ];

    const failedCriterion = criteria.find((criterion) => criterion.failure);

    if (failedCriterion) {
      player.red({ [Constants.name]: { notice: failedCriterion.notice, endBet: -1 } });

      return false;
    }

    return true;
  } catch (ex) {
    Logger.logError(ex);
  }

  return false;
};

const generateResult = () => {
  //TODO adjust ratio returns
  return chance.integer({ min: 0, max: Constants.choices.length - 1 });
};

const insertRound = async (player, coins) => {
  await SpinResult.create({
    uid: player.UID,
    name: player.profile.name,
    result: coins,
    memberId: player.session.memberId,
    siteId: player.session.siteId,
    time: new Date(),
  });
};

const substractUserSpins = async (memberId) => {
  let userSpin = await UserSpin.findOne({ obCustId: memberId }).exec();
  userSpin.availSpins -= 1;
  await userSpin.save();
};

const updateUserCoins = async (uid, coins) => {
  let user = await UserInfo.findOne({ id: uid }).exec();
  user.coins += coins;
  await user.save();
};

const spin = async (player) => {
  if (!player.session) {
    return;
  }

  if (await validateSpinRequest(player)) {
    const result = generateResult();
    const coins = Constants.choices[result];

    await insertRound(player, coins);
    await substractUserSpins(player.session.memberId);
    if (coins > 0) {
      await updateUserCoins(player.UID, coins);
    }

    player.red({
      [Constants.name]: {
        result: result,
        win: coins > 0,
        bet: coins,
      },
    });
  }
};

module.exports = (player, payload) => spin(player, payload).catch((err) => Logger.logError(err));
