const UserSpin = require("../../../Models/UserSpin");
const UserInfo = require("../../../Models/UserInfo");
const MoneyWheelRound = require("./Models/LuckyWheel_phien");

let Chance = require("chance");
const chance = new Chance();

const Constants = require("./constants");
const getSpins = require("./get-spins");

const validateSpinRequest = async (player, payload) => { 
  const remainingSpins = await getSpins(player?.session?.memberId);

  const criteria = [
    {
      failure: remainingSpins < 1,
      notice: Constants.notEnoughSpin,
    },
    {
        failure: !remainingSpins.include(_id == payload.spin),
        notice: Constants.invalidSpin,
    },    
  ];

  const failedCriterion = criteria.find((criterion) => criterion.failure);

  if (failedCriterion) {
    player.red({ [Constants.name]: { notice: failedCriterion.notice, endBet: -1 } });

    return false;
  }

  return true;
};

const generateResult = () =>{
    //TODO adjust ratio returns
    return chance.integer({min: 0, max: Constants.choices.length - 1});
}

const insertRound = async(player, coins, spinId) => {
    await MoneyWheelRound.create({
        uid: player.UID,
        name: player.profile.name,
        spinId: spinId,
        result: coins,
        memberId: player.session.memberId,
        siteId: player.session.siteId,
        time: new Date(),
    }).exec();
}

const substractUserSpins = async(spinId) => {
    await UserSpin.findByIdAndUpdate(spinId, {used: true}).exec();
}

const updateUserCoins = async(uid, coins) =>{
    let user = await UserInfo.findOne({uid: uid}).exec();
    user.coins += coins;
    await user.save();
}

module.exports = (player, payload) => {

  if (!player.session) {
    return;
  }

  if (validateSpinRequest(player, payload)) {
      
    const result = generateResult();
    const coins = constants.choices[result];

    await insertRound(player, coins, payload.spinId);
    await substractUserSpins(payload.spinId);
    await updateUserCoins(player.UID, coins);

    player.red({ [Constants.name]: {         
        result: result,
        win: coins > 0,
        bet: coins 
    } });
  }
};
