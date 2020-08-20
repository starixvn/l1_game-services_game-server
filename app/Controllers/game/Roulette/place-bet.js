const GameIds = require("./../../../../config/appConfigs").gameIds;

const BalanceApi = require("./../../../apis/balanceApi");
const ConfigHelper = require("./../../../Helpers/ConfigHelper");
const Logger = require("./../../../web/logger");

const NoticeMessages = require("./../constants/notice-messages");

const RouletteOne = require("./Models/Roulette_one").RouletteOne;
const RouletteCuoc = require("./Models/Roulette_cuoc");

const Constants = require("./constants");

const validateBetRequest = (player, betChoices, totalAmount) => {
  const rouletteData = player.redT.roulette;
  const { betTracks } = rouletteData.ingame[player.profile.name] ?? { betTracks: {} };
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Roulette);
  const totalAmountOfExistingBets = calculateTotalAmount(betTracks);
  const validBetChoices = rouletteData.avaliableChoices.groupedByTypes;

  const criteria = [
    {
      failure: rouletteData.remainingTime < Constants.lockingBetDuration || rouletteData.remainingTime >= Constants.placingBetDuration,
      notice: NoticeMessages.placeBetNextRound,
    },
    {
      failure: !configs.enabled,
      notice: NoticeMessages.placeBetNextRound,
    },
    {
      failure: anyInvalidChoice(betChoices, validBetChoices),
      notice: NoticeMessages.invalidBetChoice,
    },
    {
      failure: anyChoiceExceedItsMaxBet(betChoices, betTracks, configs),
      notice: NoticeMessages.maxBetOfAnyChoiceReached,
    },
    {
      failure: totalAmount < configs.minbet,
      notice: NoticeMessages.minBet(configs.minbet),
    },
    {
      failure: totalAmount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
    {
      failure: totalAmountOfExistingBets + totalAmount > configs.maxbet,
      notice: NoticeMessages.maxBet(configs.maxbet),
    },
  ];

  const failedCriterion = criteria.find((criterion) => criterion.failure);

  if (failedCriterion) {
    player.red({ roulette: { notice: failedCriterion.notice, endBet: -1 } });

    return false;
  }

  return true;
};

const anyInvalidChoice = (betChoices, validBetChoices) =>
  Object.entries(betChoices).some(([typeOfBets, choicesPerType]) => {
    const validBetChoicesPerType = validBetChoices[typeOfBets];

    if (!validBetChoicesPerType) {
      return true;
    }

    return Object.keys(choicesPerType).some((betChoice) => !validBetChoicesPerType.includes(betChoice));
  });

const anyChoiceExceedItsMaxBet = (betChoices, betTracks, configs) =>
  Object.entries(betChoices).some(([typeOfBets, choicesPerType]) => {
    const maxBetPerChoice = configs.choices_maxbet[typeOfBets] ?? 0;

    return Object.entries(choicesPerType).some(([betChoice, amount]) => {
      const currentBetAmount = betTracks[typeOfBets]?.[betChoice] ?? 0;

      return amount > maxBetPerChoice || currentBetAmount + amount > maxBetPerChoice;
    });
  });

const proceedBet = (player, betChoices, totalAmount) =>
  new Promise((resolve, reject) => {
    if (!player.redT || !player.redT.roulette) {
      return;
    }

    const rouletteData = player.redT.roulette;
    const betInfo = {
      gameId: GameIds.roulette,
      gameRoundId: rouletteData.roundId,
      cuoc: totalAmount,
      inSufficientBalance: { roulette: { notice: NoticeMessages.notEnoughMoney, endBet: -1 } },
    };
    const handleSuccessBetSync = ({ red }) =>
      handleSuccessBet(player, rouletteData, red, betChoices, totalAmount).then(resolve).catch(reject);
    const handleFailedBetSync = () => {
      player.red({ roulette: { endBet: -1 } });
      resolve();
    };

    BalanceApi.placeBet({ id: player.UID }, betInfo, player, handleSuccessBetSync, handleFailedBetSync);
  });

const handleSuccessBet = async (player, rouletteData, red, betChoices, totalAmount) => {
  const configs = ConfigHelper.getConfigs(ConfigHelper.GameTypes.Roulette);
  const existingBetFilter = { uid: player.UID, phien: rouletteData.roundId };
  const newBet = {
    uid: player.UID,
    name: player.profile.name,
    phien: rouletteData.roundId,
    time: new Date(),
    odds: configs.odds,
  };
  const betAmountIncrement = buildBetAmountIncrement(betChoices);

  if (player.session) {
    newBet.memberId = player.session.memberId;
    newBet.siteId = player.session.siteId;
  }

  await insertBetLog(player, rouletteData, betChoices);
  await RouletteOne.updateOne(
    existingBetFilter,
    { $inc: betAmountIncrement, $setOnInsert: newBet },
    { upsert: true, setDefaultsOnInsert: true }
  );

  trackBetChoices(rouletteData.totalBets, betChoices);
  adjustBetTracks(rouletteData, player.profile.name, betChoices);
  notifyPlacingBetResult(player, rouletteData, red, betChoices, totalAmount);
};

const buildBetAmountIncrement = (betChoices) => {
  const increment = {};

  Object.entries(betChoices).forEach(([typeOfBets, choicesPerType]) => {
    Object.entries(choicesPerType).forEach(([betChoice, amount]) => {
      increment[`${typeOfBets}.${betChoice}`] = amount;
    });
  });

  return increment;
};

const insertBetLog = async (player, rouletteData, betChoices) => {
  const newBetLog = {
    uid: player.UID,
    name: player.profile.name,
    phien: rouletteData.roundId,
    time: new Date(),
    ...betChoices,
  };

  if (player.session) {
    newBetLog.memberId = player.session.memberId;
    newBetLog.siteId = player.session.siteId;
  }

  await RouletteCuoc.create(newBetLog);
};

const adjustBetTracks = (rouletteData, playerName, betChoices) => {
  if (rouletteData.ingame && rouletteData.ingame[playerName]) {
    const playerInGame = rouletteData.ingame[playerName];

    trackBetChoices(playerInGame.betTracks, betChoices);
  }
};

const notifyPlacingBetResult = (player, rouletteData, red, betChoices, totalAmount) => {
  const name = player.profile.name;

  if (rouletteData.ingame && rouletteData.ingame[name]) {
    const playerInGame = rouletteData.ingame[name];
    const { betTracks: ownBets } = playerInGame;

    Object.values(rouletteData.realPlayers).forEach((realPlayer) => {
      if (player.UID === realPlayer.UID) {
        realPlayer.red({
          roulette: {
            endBet: totalAmount,
            ownBets,
          },
          user: { red },
        });
      } else {
        realPlayer.red({
          roulette: {
            othersBetChoices: {
              playerId: player.UID,
              betChoices,
              red,
            },
          },
        });
      }
    });
  }
};

const trackBetChoices = (tracks, betChoices) =>
  Object.entries(betChoices).forEach(([typeOfBets, choicesPerType]) => {
    const trackChoicesPerType = tracks[typeOfBets] || {};

    Object.entries(choicesPerType).forEach(([betChoice, amount]) => {
      trackChoicesPerType[betChoice] = (trackChoicesPerType[betChoice] || 0) + amount;
    });

    if (!tracks[typeOfBets]) {
      tracks[typeOfBets] = trackChoicesPerType;
    }
  });

const calculateTotalAmount = (betChoices) =>
  Object.values(betChoices).reduce((previousTotalAmount, choicesPerType) => {
    if (choicesPerType) {
      const totalAmountPerType = Object.values(choicesPerType).reduce(
        (previousTotalAmountPerType, amount) => previousTotalAmountPerType + amount,
        0
      );

      return previousTotalAmount + totalAmountPerType;
    }

    return previousTotalAmount;
  }, 0);

const placeBet = (player, payload) => {
  if (!payload.betChoices) {
    return;
  }

  const betChoices = payload.betChoices;
  const totalAmount = calculateTotalAmount(betChoices);

  if (!validateBetRequest(player, betChoices, totalAmount)) {
    return;
  }

  const name = player.profile.name;
  const rouletteData = player.redT.roulette;

  if (!rouletteData.ingame[name]) {
    const newPlayer = {
      name: player.profile.name,
      betTracks: {},
      betQueue: [],
    };

    rouletteData.ingame[name] = newPlayer;
  }

  rouletteData.ingame[name].betQueue.push({ player, betChoices, totalAmount });
};

const dequeueBets = (io) => {
  if (io.roulette.ingame) {
    Object.values(io.roulette.ingame).forEach((playerInGame) => {
      if (!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0) {
        const { player, betChoices, totalAmount } = playerInGame.betQueue.shift();

        playerInGame.betProcessing = true;
        proceedBet(player, betChoices, totalAmount)
          .then(() => (playerInGame.betProcessing = false))
          .catch(Logger.logError);
      }
    });
  }
};

const proceedBetQueue = (io) => {
  const dequeueInterval = 50;
  const keepDequeuingBets = () => {
    dequeueBets(io);
    setTimeout(keepDequeuingBets, dequeueInterval);
  };

  setTimeout(keepDequeuingBets, dequeueInterval);
};

module.exports = {
  placeBet,
  proceedBetQueue,
};
