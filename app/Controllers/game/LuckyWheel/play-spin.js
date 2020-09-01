const UserSpin = require("./Models/Spin");
const UserInfo = require("../../../Models/UserInfo");
const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const SpinResult = require("./Models/Spin_Result");

let Chance = require("chance");
const chance = new Chance();

const Constants = require("./constants");
const Logger = require("../../../web/logger");
const getSpins = require("./get-spins");
const { getTotalSpinnedCoins } = require("./get-logs");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");

const validateSpinRequest = async (player) => {
  const userSpin = await getSpins(player?.session?.memberId);
  const enabled = (await GameConfigs.findOne({ name: ConfigHelper.GameTypes.LuckyWheel })).enabled;

  try {
    const criteria = [
      {
        failure: !enabled,
        notice: Constants.invalidSpin,
      },
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
  let userSpin = await UserSpin.findOne({ memberId: memberId }).exec();
  userSpin.availSpins -= 1;
  userSpin.usedSpins += 1;

  await userSpin.save();

  return userSpin.availSpins;
};

const updateUserCoins = async (uid, coins) => {
  let user = await UserInfo.findOne({ id: uid }).exec();
  if (coins > 0) {
    user.scoins += coins;
    await user.save();
  }
};

const spin = async (player) => {
  if (!player.session) {
    return;
  }

  if (await validateSpinRequest(player)) {
    const result = generateResult();
    const coins = Constants.choices[result];

    await insertRound(player, coins);
    const availSpins = await substractUserSpins(player.session.memberId);
    await updateUserCoins(player.UID, coins);
    const totalCoins = await getTotalSpinnedCoins(player);

    const status = {
      coins,
      availSpins,
      totalCoins,
    };

    player.red({ [Constants.name]: { status } });
  }
};

module.exports = (player) => spin(player).catch((err) => Logger.logError(err));
