const moment = require('moment');
const GameIds = require("./../../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../../apis/balanceApi");
const BetChoiceMapper = require("./../../../../apis/betChoiceMapper");
const Logger = require("./../../../../web/logger");

const Constants = require("./constants");
const NoticeMessages = require("./../../constants/notice-messages");

const KenoProVietCuoc = require("./models/KenoProViet_cuoc");
const KenoProVietOne = require("./models/KenoProViet_one");

const proceedBet = (player, payload) =>
  new Promise((resolve, reject) => {
    if (!player.redT || !player.redT.kenoProViet) {
      return;
    }

    const kenoProVietData = player.redT.kenoProViet;
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const betInfo = {
      gameId: GameIds.kenoproviet,
      gameRoundId: payload.roundId,
      choiceId: BetChoiceMapper.convertKenoProMax(betChoice), //TODO map to keno pro viet?!?
      cuoc: amount,
      inSufficientBalance: { kenoProViet: { notice: NoticeMessages.notEnoughMoney, endBet: -1 } },
      RoundEndTime: generateRoundEndTime(payload.roundId, kenoProVietData.roundId, kenoProVietData.roundStartTime)
    };
    const handleSuccessBetSync = ({ red }) => handleSuccessBet(player, kenoProVietData, red, betChoice, amount, payload.roundId).then(resolve).catch(reject);
    const handleFailedBetSync = () => {
      handleFailedBet(player, kenoProVietData, betChoice, amount);
      resolve();
    };

    BalanceApi.placeBet({ id: player.UID }, betInfo, player, handleSuccessBetSync, handleFailedBetSync);
  });

const generateRoundEndTime = (roundId, currentRoundId, currentRoundStartTime) => {
  const remainingRoundEndMinutes = (currentRoundId - roundId+ 1) * Constants.durations.wholeRound;

  return moment(currentRoundStartTime).add(remainingRoundEndMinutes, 'm').utc();
}

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
    [betChoice]: amount,
    time: new Date(),
  });

  notifyPlacingBetResult(player, kenoProVietData, red, betChoice, amount, roundId);
};

const handleFailedBet = (player, kenoProVietData, betChoice, amount) => {
  const name = player.profile.name;

  if (kenoProVietData.ingame && kenoProVietData.ingame[name]) {
    const playerInGame = kenoProVietData.ingame[name];

    playerInGame.betTracks[betChoice] -= amount;
  }

  player.red({ kenoProViet: { endBet: -1 } });
};

const notifyPlacingBetResult = (player, kenoProVietData, red, betChoice, amount, roundId) => {
  const name = player.profile.name;

  kenoProVietData.totalBets[betChoice] += amount;

  if (kenoProVietData.ingame && kenoProVietData.ingame[name]) {
    const playerInGame = kenoProVietData.ingame[name];
    const { betTracks: ownBets } = playerInGame;

    if (player.redT && player.redT.users) {
      player.redT.users[player.UID].forEach((player) => {
        player.red({
          kenoProViet: { totalBets: kenoProVietData.totalBets, endBet: amount, ownBets , roundId },
          user: { red },
        });
      });
    }
  }
};

const proceedQueue = (io) => {
  if (io.kenoProViet.ingame) {
    Object.values(io.kenoProViet.ingame).forEach((playerInGame) => {
      if (!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0) {
        const { player, payload } = playerInGame.betQueue.shift();

        playerInGame.betProcessing = true;
        proceedBet(player, payload)
          .then(() => (playerInGame.betProcessing = false))
          .catch(Logger.logError);
      }
    });
  }
};

module.exports = (io) => {
  const processTimeOut = 50;

  setTimeout(function proceed() {
    proceedQueue(io);
    setTimeout(proceed, processTimeOut);
  }, processTimeOut);
};
