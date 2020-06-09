const BalanceApi = require("./../../../../../apis/balanceApi");
const BetChoiceMapper = require("./../../../../../apis/betChoiceMapper");
const Logger = require("./../../../../../web/logger");

const NoticeMessages = require("./../../../constants/notice-messages");

const proceedBet = (definition, player, payload) =>
  new Promise((resolve, reject) => {
    const gameName = definition.name;

    if (!player.redT || !player.redT[gameName]) {
      return;
    }

    const gameData = player.redT[gameName];
    const amount = payload.amount >> 0;
    const betChoice = payload.betChoice;
    const betInfo = {
      gameId: definition.id,
      gameRoundId: gameData.roundId,
      choiceId: BetChoiceMapper.convertKenoProMax(betChoice),
      cuoc: amount,
      inSufficientBalance: { [gameName]: { notice: NoticeMessages.notEnoughMoney, endBet: -1 } },
    };
    const handleSuccessBetSync = ({ red }) =>
      handleSuccessBet(definition, player, gameData, red, betChoice, amount).then(resolve).catch(reject);
    const handleFailedBetSync = () => {
      handleFailedBet(definition.name, player, gameData, betChoice, amount);
      resolve();
    };

    BalanceApi.placeBet({ id: player.UID }, betInfo, player, handleSuccessBetSync, handleFailedBetSync);
  });

const handleSuccessBet = async (definition, player, gameData, red, betChoice, amount) => {
  const existingBetFilter = { uid: player.UID, phien: gameData.roundId };
  const existingBet = await definition.betRepository.findOne(existingBetFilter).exec();

  await insertBetLog(definition, player, gameData, betChoice, amount);

  if (existingBet) {
    existingBet[betChoice] += amount;
    await existingBet.save();
  } else {
    const newBet = {
      uid: player.UID,
      name: player.profile.name,
      phien: gameData.roundId,
      time: new Date(),
    };
    const existingBetIncrement = { [betChoice]: amount };

    if (player.session) {
      newBet.memberId = player.session.memberId;
      newBet.siteId = player.session.siteId;
    }

    await definition.betRepository.updateOne(
      existingBetFilter,
      { $inc: existingBetIncrement, $setOnInsert: newBet },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  notifyPlacingBetResult(definition.name, player, gameData, red, betChoice, amount);
};

const insertBetLog = async (definition, player, gameData, betChoice, amount) => {
  const newBetLog = {
    uid: player.UID,
    name: player.profile.name,
    phien: gameData.roundId,
    time: new Date(),
    choice: betChoice,
    amount,
  };

  if (player.session) {
    newBetLog.memberId = player.session.memberId;
    newBetLog.siteId = player.session.siteId;
  }

  await definition.betLogRepository.create(newBetLog);
};

const handleFailedBet = (gameName, player, gameData, betChoice, amount) => {
  const name = player.profile.name;

  if (gameData.ingame && gameData.ingame[name]) {
    const playerInGame = gameData.ingame[name];

    playerInGame.betTracks[betChoice] -= amount;
  }

  player.red({ [gameName]: { endBet: -1 } });
};

const notifyPlacingBetResult = (gameName, player, gameData, red, betChoice, amount) => {
  const name = player.profile.name;

  gameData.totalBets[betChoice] += amount;

  if (gameData.ingame && gameData.ingame[name]) {
    const playerInGame = gameData.ingame[name];
    const { betTracks: ownBets } = playerInGame;

    if (player.redT && player.redT.users) {
      player.redT.users[player.UID].forEach((player) => {
        player.red({
          [gameName]: { totalBets: gameData.totalBets, endBet: amount, ownBets },
          user: { red },
        });
      });
    }
  }
};

const proceedQueue = (definition, io) => {
  const gameName = definition.name;

  if (io[gameName].ingame) {
    Object.values(io[gameName].ingame).forEach((playerInGame) => {
      if (!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0) {
        const { player, payload } = playerInGame.betQueue.shift();

        playerInGame.betProcessing = true;
        proceedBet(definition, player, payload)
          .then(() => (playerInGame.betProcessing = false))
          .catch(Logger.logError);
      }
    });
  }
};

module.exports = (io, definition) => {
  const processTimeOut = 50;

  setTimeout(function proceed() {
    proceedQueue(definition, io);
    setTimeout(proceed, processTimeOut);
  }, processTimeOut);
};
