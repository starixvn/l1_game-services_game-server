const GameIds = require("./../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../apis/balanceApi");
const BetChoiceMapper = require("./../../../apis/betChoiceMapper");
const Logger = require("./../../../web/logger");

const NoticeMessages = require("./../constants/notice-messages");

const MiniSedieCuoc = require("./models/MiniSedie_cuoc");

const proceedBet = (player, payload) => {
  if (!player.redT || !player.redT.miniSedie) {
    return;
  }

  const miniSedieData = player.redT.miniSedie;
  const amount = payload.amount >> 0;
  const betChoice = payload.betChoice;
  const betInfo = {
    gameId: GameIds.minisedie,
    gameRoundId: miniSedieData.roundId,
    choiceId: BetChoiceMapper.convertMiniSedie(betChoice),
    cuoc: amount,
    inSufficientBalance: { miniSedie: { notice: NoticeMessages.notEnoughMoney } },
  };
  const handleSuccessBetSync = (red) =>
    handleSuccessBet(player, miniSedieData, red, betChoice, amount).catch(Logger.logError);

  BalanceApi.placeBet(
    { id: player.UID },
    betInfo,
    player,
    ({ red }) => handleSuccessBetSync(red),
    () => handleFailedBet(player, miniSedieData, betChoice, amount)
  );
};

const handleSuccessBet = async (player, miniSedieData, red, betChoice, amount) => {
  const existingBetFilter = { uid: player.UID, phien: miniSedieData.roundId };
  const existingBet = await MiniSedieCuoc.findOne(existingBetFilter).exec();

  if (existingBet) {
    existingBet[betChoice] += amount;
    await existingBet.save();
  } else {
    const newBet = {
      uid: player.UID,
      name: player.profile.name,
      phien: miniSedieData.roundId,
      time: new Date(),
    };
    const existingBetIncrement = { [betChoice]: amount };

    if (player.session) {
      newBet.memberId = player.session.memberId;
      newBet.siteId = player.session.siteId;
    }

    await MiniSedieCuoc.updateOne(
      existingBetFilter,
      { $inc: existingBetIncrement, $setOnInsert: newBet },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  notifyPlacingBetResult(player, miniSedieData, red, betChoice, amount);
};

const handleFailedBet = (player, miniSedieData, betChoice, amount) => {
  const name = player.profile.name;

  if (miniSedieData.ingame && miniSedieData.ingame[name]) {
    const playerInGame = miniSedieData.ingame[name];

    playerInGame.betTracks[betChoice] -= amount;
  }
};

const notifyPlacingBetResult = (player, miniSedieData, red, betChoice, amount) => {
  const name = player.profile.name;

  miniSedieData.totalBets[betChoice] += amount;

  if (miniSedieData.ingame && miniSedieData.ingame[name]) {
    const playerInGame = miniSedieData.ingame[name];
    const { betTracks: ownBets } = playerInGame;

    if (player.redT && player.redT.users) {
      player.redT.users[player.UID].forEach((player) => {
        player.red({
          miniSedie: { totalBets: miniSedieData.totalBets, endBet: amount, ownBets },
          user: { red },
        });
      });
    }
  }
};

const proceedQueue = (io) => {
  if (io.miniSedie.ingame) {
    Object.values(io.miniSedie.ingame).forEach(async (playerInGame) => {
      if (playerInGame.betQueue && playerInGame.betQueue.length > 0) {
        const { player, payload } = playerInGame.betQueue.shift();

        proceedBet(player, payload);
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
