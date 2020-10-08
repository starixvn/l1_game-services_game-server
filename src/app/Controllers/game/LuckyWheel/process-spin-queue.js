const UserSpin = require("./Models/Spin");
const UserInfo = require("../../../Models/UserInfo");
const GameConfigs = require("../../../Models/GameConfig/GameConfigs");
const SpinResult = require("./Models/Spin_Result");

let Chance = require("chance");
const chance = new Chance();

const Constants = require("./constants");
const Logger = require("../../../web/logger");
const getSpins = require("./get-spins");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");

const dequeueBets = (io) => {
  const luckyWheelData = io.luckyWheel;

  if (luckyWheelData.ingame) {
    Object.values(luckyWheelData.ingame).forEach((playerInGame) => {
      if (!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0) {
        const { player, memberId } = playerInGame.betQueue.shift();

        playerInGame.betProcessing = true;
        proceedSpin(player, memberId)
          .then(() => (playerInGame.betProcessing = false))
          .catch(Logger.logError);
      }
    });
  }
};

const proceedSpin = async (player, memberId) => {
  if (await validateSpinRequest(player, memberId)) {
    const result = generateResult();
    const coins = Constants.choices[result];

    await insertRound(player, coins);
    const availSpins = await substractUserSpins(memberId);
    const totalCoins = await updateUserCoins(player.UID, coins);

    const status = {
      coins,
      availSpins,
      totalCoins,
    };

    player.red({ [Constants.name]: { status } });
  }
};

const validateSpinRequest = async (player, memberId) => {
  const userSpin = await getSpins(memberId);
  const config = await GameConfigs.findOne({ name: ConfigHelper.GameTypes.LuckyWheel }).lean().exec();
  const disabledMessage = config === null ? "" : config.disabled_message;
  const disabled = config === null || !config.enabled;

  try {
    const criteria = [
      {
        failure: disabled,
        notice: disabledMessage,
      },
      {
        failure: userSpin?.availSpins < 1,
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
    memberId: player?.session?.memberId,
    siteId: player?.session?.siteId,
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

  if (user) {
    if (coins > 0) {
      user.scoins += coins;
      await user.save();
    }

    return user.scoins;
  }

  return 0;
};

module.exports = (io) => {
  const dequeueInterval = 50;
  const keepDequeuingBets = () => {
    dequeueBets(io);
    setTimeout(keepDequeuingBets, dequeueInterval);
  };

  setTimeout(keepDequeuingBets, dequeueInterval);
};
