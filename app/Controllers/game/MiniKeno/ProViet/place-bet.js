const ConfigHelper = require("./../../../../Helpers/ConfigHelper");
const NoticeMessages = require("./../../constants/notice-messages");
const Constants = require("./constants");

const moment = require("moment");
const GameIds = require("./../../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../../apis/balanceApi");
const BetChoiceMapper = require("./../../../../apis/betChoiceMapper");
const Logger = require("./../../../../web/logger");

const KenoProVietCuoc = require("./models/KenoProViet_cuoc");
const KenoProVietOne = require("./models/KenoProViet_one");

const validateBetRequest = (player, { amount, betChoice, roundId }) => {
  if (!amount || !betChoice || !roundId) {
    return false;
  }

  const kenoProVietData = player.redT.kenoProViet;
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.KenoProViet);

  //TODO update betTracks follow round Id
  const { betTracks } =
    kenoProVietData.ingame[player.profile.name] && kenoProVietData.ingame[player.profile.name].roundBetTracks[roundId]
      ? kenoProVietData.ingame[player.profile.name].roundBetTracks[roundId]
      : { betTracks: {} };

  const totalAmount = Constants.choices.reduce((total, choice) => total + (betTracks[choice] || 0), 0) + amount;

  const maxBetPerChoice = configs.choices_maxbet[betChoice];
  const kenoProVietTime = Constants.durations.placingBets;

  const criteria = [
    {
      failure: roundId < kenoProVietData.roundId,
      notice: NoticeMessages.cannotPlaceBet,
    },
    {
      failure:
        kenoProVietData.roundId === roundId &&
        kenoProVietData.remainingTime >= Constants.durations.lockingBets &&
        kenoProVietData.remainingTime <= kenoProVietTime,
      notice: NoticeMessages.placeBetNextRound,
    },
    {
      failure: amount > maxBetPerChoice || betTracks[betChoice] + amount > maxBetPerChoice,
      notice: NoticeMessages.maxBetForChoice(maxBetPerChoice),
    },
    {
      failure: amount < configs.minbet,
      notice: NoticeMessages.minBet(configs.minbet),
    },
    {
      failure: amount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
    {
      failure: totalAmount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
  ];

  const failedCriterion = criteria.find((criterion) => criterion.failure);

  if (failedCriterion) {
    player.red({ kenoProViet: { notice: failedCriterion.notice, endBet: -1 } });

    return false;
  }

  return true;
};

const generateRoundEndTime = (roundId, currentRoundId, currentRoundStartTime) => {
  const remainingRoundEndMinutes = (currentRoundId - roundId + 1) * Constants.durations.wholeRound;

  return moment(currentRoundStartTime).add(remainingRoundEndMinutes, "m").utc().toDate();
};

//TODO process for other round, not only current round id
const handleSuccessBet = async (player, kenoProVietData, red, betChoice, amount, roundId) => {
  const existingBetFilter = { uid: player.UID, phien: roundId };
  const existingBet = await KenoProVietOne.findOne(existingBetFilter).exec();

  if (existingBet) {
    existingBet[betChoice] += amount;
    await existingBet.save();
  } else {
    const newBet = {
      uid: player.UID,
      name: player.profile.name,
      phien: roundId,
      time: new Date(),
    };
    const existingBetIncrement = { [betChoice]: amount };

    if (player.session) {
      newBet.memberId = player.session.memberId;
      newBet.siteId = player.session.siteId;
    }

    await KenoProVietOne.updateOne(
      existingBetFilter,
      { $inc: existingBetIncrement, $setOnInsert: newBet },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  await KenoProVietCuoc.create({
    uid: player.UID,
    name: player.profile.name,
    phien: roundId,
    choice: betChoice,
    amount: amount,
    time: new Date(),
  });

  notifyPlacingBetResult(player, kenoProVietData, red, betChoice, amount, roundId);
};

const handleFailedBet = (player, kenoProVietData, betChoice, amount, roundId) => {
  const name = player.profile.name;

  if (kenoProVietData.ingame && kenoProVietData.ingame[name]) {
    const playerInGame = kenoProVietData.ingame[name];

    playerInGame.roundBetTracks[roundId][betChoice] -= amount;
  }

  player.red({ kenoProViet: { endBet: -1 } });
};

const notifyPlacingBetResult = (player, kenoProVietData, red, betChoice, amount, roundId) => {
  const name = player.profile.name;

  kenoProVietData.totalBets[betChoice] += amount;

  if (kenoProVietData.ingame && kenoProVietData.ingame[name]) {
    const playerInGame = kenoProVietData.ingame[name];

    const { betTracks: ownBets } = playerInGame.roundBetTracks.filter((roundBet) => {
      return roundBet.roundId == roundId;
    });

    if (player.redT && player.redT.users) {
      player.redT.users[player.UID].forEach((player) => {
        player.red({
          kenoProViet: { totalBets: kenoProVietData.totalBets, endBet: amount, ownBets, roundId },
          user: { red },
        });
      });
    }
  }
};

const proceedBet = (player, payload) =>
  new Promise((resolve, reject) => {
    if (!player.redT || !player.redT.kenoProViet) {
      return;
    }

    const kenoProVietData = player.redT.kenoProViet;
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const roundId = payload.roundId;
    const betInfo = {
      gameId: GameIds.kenoproviet,
      gameRoundId: payload.roundId,
      choiceId: BetChoiceMapper.convertKeno(betChoice),
      cuoc: amount,
      inSufficientBalance: { kenoProViet: { notice: NoticeMessages.notEnoughMoney, endBet: -1 } },
      roundEndTime: generateRoundEndTime(payload.roundId, kenoProVietData.roundId, kenoProVietData.roundStartTime),
    };

    const handleSuccessBetSync = ({ red }) =>
      handleSuccessBet(player, kenoProVietData, red, betChoice, amount, roundId).then(resolve).catch(reject);
    const handleFailedBetSync = () => {
      handleFailedBet(player, kenoProVietData, betChoice, amount, roundId);
      resolve();
    };

    BalanceApi.placeBet({ id: player.UID }, betInfo, player, handleSuccessBetSync, handleFailedBetSync);
  });

const initBetTrack = (betChoice, amount) => {
  let betTracks = { ...Constants.resetTotalBets };
  betTracks[betChoice] = amount;

  return betTracks;
};

const placeBet = (player, payload) => {
  if (validateBetRequest(player, payload)) {
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const roundId = payload.roundId;

    const name = player.profile.name;
    const kenoProVietData = player.redT.kenoProViet;

    if (kenoProVietData.ingame[name] && kenoProVietData.ingame[name].roundBetTracks.length > 0) {
      const existingRoundBets = kenoProVietData.ingame[name].roundBetTracks.filter((roundBetTrack) => {
        return roundBetTrack.roundId == roundId;
      });
      const existingRound = existingRoundBets[0];

      if (existingRound) {
        existingRound.betTracks[betChoice] += amount;
      } else {
        const betTracks = initBetTrack(betChoice, amount);
        kenoProVietData.ingame[name].roundBetTracks.push({ roundId, betTracks });
      }
    } else {
      const newPlayer = {
        name: player.profile.name,
        roundBetTracks: [],
      };
      const betTracks = initBetTrack(betChoice, amount);
      newPlayer.roundBetTracks = [{ roundId, betTracks }];
      kenoProVietData.ingame[name] = newPlayer;
    }

    proceedBet(player, payload);
  }
};

module.exports = placeBet;
